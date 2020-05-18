/* globals mapboxgl, document, window */

// import * as mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import * as fetch from './lib/fetch.js';

import { getSource } from './lib/templates.js';
import { getRatio, getPercent } from './lib/math.js';
import { getLocationGranularityName } from './lib/geography.js';
import * as color from './lib/color.js';

import graph from './graph.js';

mapboxgl.accessToken = 'pk.eyJ1IjoibGF6ZCIsImEiOiJjazd3a3VoOG4wM2RhM29rYnF1MDJ2NnZrIn0.uPYVImW8AVA71unqE8D8Nw';

const data = {};

let map;

let currentType = 'cases';
let currentDate;
let currentData;

function findFeature(id) {
  return data.features.features.find(feature => feature.properties.id === id);
}

function initData() {
  let foundFeatures = 0;
  data.locations.forEach(function(location, index) {
    // Associated the feature with the location
    if (location.featureId !== undefined && !location.city) {
      const feature = findFeature(location.featureId);
      if (feature) {
        foundFeatures++;
        feature.properties.locationId = index;
      } else {
        console.log('Failed to find feature for', location);
      }
    }
  });

  data.features.features.forEach(function(feature, index) {
    feature.id = index;
  });

  console.log('Found locations for %d of %d features', foundFeatures, data.features.features.length);
}

function generateCountyFeatures() {
  const countyFeatures = {
    type: 'FeatureCollection',
    features: data.features.features.filter(
      feature =>
        data.locations[feature.properties.locationId] &&
        data.locations[feature.properties.locationId].level === 'county'
    )
  };
  return countyFeatures;
}

function generateStateFeatures() {
  const stateFeatures = {
    type: 'FeatureCollection',
    features: data.features.features.filter(
      feature =>
        data.locations[feature.properties.locationId] && data.locations[feature.properties.locationId].level === 'state'
    )
  };
  return stateFeatures;
}

function generateCountryFeatures() {
  const countryFeatures = {
    type: 'FeatureCollection',
    features: data.features.features.filter(
      feature =>
        data.locations[feature.properties.locationId] &&
        data.locations[feature.properties.locationId].level === 'country'
    )
  };
  return countryFeatures;
}

function setData() {
  const countyFeatures = generateCountyFeatures();
  const stateFeatures = generateStateFeatures();
  const countryFeatures = generateCountryFeatures();

  map.getSource('CDS-county').setData(countyFeatures);
  map.getSource('CDS-state').setData(stateFeatures);
  map.getSource('CDS-country').setData(countryFeatures);
}

function updateMap(date, type) {
  currentType = type || currentType;
  currentDate = date || Object.keys(data.timeseries).pop();
  currentData = data.timeseries[currentDate];

  let worstAffectedPercent = 0;
  let lowestInfectionPercent = Infinity;

  let chartDataMin;
  let chartDataMax;
  let lowestLocation = null;
  let highestLocation = null;

  data.locations.forEach(function(location, index) {
    // Calculate worst affected percent
    if (location.population) {
      const locationData = currentData[index];
      if (locationData) {
        const infectionPercent = locationData[currentType] / location.population;
        if (infectionPercent > worstAffectedPercent) {
          worstAffectedPercent = infectionPercent;
          highestLocation = location;
        }

        // Calculate least affected percent
        if (infectionPercent !== 0 && infectionPercent < lowestInfectionPercent) {
          lowestInfectionPercent = infectionPercent;
          lowestLocation = location;
        }
        chartDataMax = worstAffectedPercent;
        chartDataMin = lowestInfectionPercent;
      }
    }
  });

  data.features.features.forEach(function(feature) {
    let regionColor = null;
    const { locationId } = feature.properties;
    const location = data.locations[locationId];
    if (location && location.population) {
      const locationData = currentData[locationId];
      if (locationData) {
        if (locationData[currentType] === 0) {
          regionColor = color.noCasesColor;
        } else {
          regionColor = color.getScaledColorValue(location, locationData, currentType, worstAffectedPercent);
        }
      }
    }

    feature.properties.color = regionColor || color.noPopulationDataColor;
  });

  console.log('Lowest infection', lowestLocation);
  console.log('Highest infection', highestLocation);

  color.createLegend(chartDataMin, chartDataMax, currentType === 'deaths' ? 'passed away' : 'infected');

  setData();
}

window.updateMap = updateMap;

function populateMap() {
  initData();

  /**
   * @param {{ name: string; population: string?; }} location
   * @param {{ cases: number; deaths:number?; recovered:number?; active:number?; }} locationData
   */
  function popupTemplate(location, locationData) {
    let htmlString = `<div class="cds-Popup">`;
    htmlString += `<h6 class="spectrum-Heading spectrum-Heading--XXS">${location.name}</h6>`;
    htmlString += `<table class="cds-Popup-table spectrum-Body spectrum-Body--XS"><tbody>`;
    if (locationData.cases !== undefined) {
      htmlString += `<tr><th>Cases:</th><td>${locationData.cases.toLocaleString()}</td></tr>`;
    }
    if (locationData.deaths !== undefined) {
      htmlString += `<tr><th>Deaths:</th><td>${locationData.deaths.toLocaleString()}</td></tr>`;
    }
    if (locationData.recovered !== undefined) {
      htmlString += `<tr><th>Recovered:</th><td>${locationData.recovered.toLocaleString()}</td></tr>`;
    }
    if (locationData.active && locationData.active !== locationData.cases) {
      htmlString += `<tr><th>Active:</th><td>${locationData.active.toLocaleString()}</td></tr>`;
    }
    if (location.population && locationData.cases) {
      htmlString += `<tr><th>Infected:</th><td>${getRatio(locationData.cases, location.population)} (${getPercent(
        locationData.cases,
        location.population
      )})</td></tr>`;
    }
    if (location.population && locationData.deaths) {
      htmlString += `<tr><th>Deaths:</th><td>${getRatio(locationData.deaths, location.population)} (${getPercent(
        locationData.deaths,
        location.population
      )})</td></tr>`;
    }
    if (location.population !== undefined) {
      htmlString += `<tr><th>Population:</th><td>${location.population.toLocaleString()}</td></tr>`;
      if (location.populationDensity !== undefined) {
        let density = location.populationDensity / 0.621371;
        if (density < 1) {
          density = (location.populationDensity / 0.621371).toFixed(2);
        } else {
          density = Math.floor(density);
        }
        htmlString += `<tr><th>Density:</th><td>${density.toLocaleString()} persons / sq. mi</td></tr>`;
      }
    } else {
      htmlString += `<tr><th colspan="2">NO POPULATION DATA</th></tr>`;
    }
    htmlString += `<tr><th>Source:</th><td>${getSource(location, { link: false, shortNames: true })}</td></tr>`;
    htmlString += `</tbody></table>`;
    htmlString += `</div>`;
    return htmlString;
  }

  const paintConfig = {
    // 'fill-outline-color': 'rgba(255, 255, 255, 1)',
    'fill-color': ['get', 'color'],
    'fill-outline-color': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      color.outlineColorHighlight,
      color.outlineColor
    ],
    'fill-opacity': 1
  };

  const { layers } = map.getStyle();
  // Find the index of the first symbol layer (the label layer) in the map style
  let labelLayerId;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
      labelLayerId = layers[i].id;
      break;
    }
  }

  map.addSource('CDS-country', {
    type: 'geojson',
    data: null
  });

  map.addLayer(
    {
      id: 'CDS-country',
      type: 'fill',
      source: 'CDS-country',
      layout: {},
      paint: paintConfig
    },
    // Place layer underneath label layer of template map.
    labelLayerId
  );

  map.addSource('CDS-state', {
    type: 'geojson',
    data: null
  });

  map.addLayer(
    {
      id: 'CDS-state',
      type: 'fill',
      source: 'CDS-state',
      layout: {},
      paint: paintConfig
    },
    labelLayerId
  );

  map.addSource('CDS-county', {
    type: 'geojson',
    data: null
  });

  map.addLayer(
    {
      id: 'CDS-county',
      type: 'fill',
      source: 'CDS-county',
      layout: {},
      paint: paintConfig
    },
    labelLayerId
  );

  // Level Toggle
  class ToggleDataLevelControl {
    onAdd(map) {
      this._container = document.createElement('div');
      this._container.className = 'mapboxgl-ctrl cds-MapControl';
      this._container.innerHTML = `
        <label class="cds-MapToggle"><input type="checkbox" name="country" checked> Show Countries</label>
        <label class="cds-MapToggle"><input type="checkbox" name="state" checked> Show States</label>
        <label class="cds-MapToggle"><input type="checkbox" name="county" checked> Show Counties</label>
        `;

      this._container.addEventListener('change', evt => {
        const { target } = evt;
        const visibility = target.checked ? 'visible' : 'none';
        const { name } = evt.target;
        map.setLayoutProperty(`CDS-${name}`, 'visibility', visibility);
      });

      return this._container;
    }

    onRemove() {
      this._container.parentNode.removeChild(this._container);
    }
  }

  map.addControl(new ToggleDataLevelControl(), 'top-left');

  // Date selector
  class DateSelector {
    onAdd() {
      const dates = Object.keys(data.timeseries);
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];

      this._container = document.createElement('div');
      this._container.className = 'mapboxgl-ctrl cds-MapControl';
      this._container.innerHTML = `
        <input type="date" min="${firstDate}" max="${lastDate}" value="${lastDate}" class="cds-Map-datePicker" aria-label="Date">
      `;

      this._container.addEventListener('input', evt => {
        const { target } = evt;
        const date = target.value;
        if (dates.includes(date)) {
          updateMap(date);
        }
      });

      return this._container;
    }

    onRemove() {
      this._container.parentNode.removeChild(this._container);
    }
  }

  map.addControl(new DateSelector(), 'top-right');

  // Case thpe selector
  class CaseTypeSelector {
    onAdd() {
      this._container = document.createElement('div');
      this._container.className = 'mapboxgl-ctrl cds-MapControl';
      this._container.innerHTML = `
        <select>
          <option value="cases">Cases</option>
          <option value="deaths">Deaths</option>
        </select>
      `;

      this._container.addEventListener('change', evt => {
        const { target } = evt;
        currentType = target.value;
        updateMap(currentDate, currentType);
      });

      return this._container;
    }

    onRemove() {
      this._container.parentNode.removeChild(this._container);
    }
  }

  map.addControl(new CaseTypeSelector(), 'top-left');

  setData();

  // Create a popup, but don't add it to the map yet.
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  let hoveredFeatureId = null;
  let hoveredFeatureSource = null;

  function handleMouseLeave() {
    map.getCanvas().style.cursor = '';
    popup.remove();
    if (hoveredFeatureId) {
      map.setFeatureState({ source: 'CDS-state', id: hoveredFeatureId }, { hover: false });
    }
  }

  function handleMouseClick(e) {
    if (e.features.length > 0) {
      e.preventDefault();
      const feature = e.features[0];

      const { locationId } = feature.properties || {};
      const location = data.locations[locationId] || {};
      const locationData = Object.keys(data.timeseries).map(date => {
        return {
          date,
          ...data.timeseries[date][locationId]
        };
      });

      graph(location, locationData);
    }
  }

  function handleMouseMove(e) {
    if (e.features.length > 0) {
      e.preventDefault();
      const feature = e.features[0];

      const { locationId } = feature.properties || {};
      const location = data.locations[locationId] || {};
      const locationData = currentData[locationId] || {};

      if (hoveredFeatureId) {
        map.setFeatureState({ source: hoveredFeatureSource, id: hoveredFeatureId }, { hover: false });
      }

      hoveredFeatureId = feature.id;
      hoveredFeatureSource = `CDS-${getLocationGranularityName(location)}`;

      if (hoveredFeatureId) {
        map.setFeatureState({ source: hoveredFeatureSource, id: hoveredFeatureId }, { hover: true });
      }

      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = 'pointer';

      // Populate the popup and set its coordinates
      // based on the feature found.
      popup
        .setLngLat(e.lngLat)
        .setHTML(popupTemplate(location, locationData))
        .addTo(map);
    }
  }

  // When the user moves their mouse over the state-fill layer, we'll update the
  // feature state for the feature under the mouse.
  map.on('mousemove', 'CDS-country', handleMouseMove);
  map.on('mousemove', 'CDS-state', handleMouseMove);
  map.on('mousemove', 'CDS-county', handleMouseMove);

  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', 'CDS-country', handleMouseLeave);
  map.on('mouseleave', 'CDS-state', handleMouseLeave);
  map.on('mouseleave', 'CDS-county', handleMouseLeave);

  // When the user clicks, open a timeseries graph
  map.on('click', 'CDS-country', handleMouseClick);
  map.on('click', 'CDS-state', handleMouseClick);
  map.on('click', 'CDS-county', handleMouseClick);
  updateMap();
}

let rendered = false;
function showMap() {
  if (rendered) {
    return;
  }
  rendered = true;

  document.body.classList.add('is-editing');

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/lazd/ck7wkzrxt0c071ip932rwdkzj',
    center: [-121.403732, 40.492392],
    zoom: 3
  });

  let remaining = 0;
  function handleLoaded() {
    remaining--;
    if (remaining === 0) {
      if (map.loaded()) {
        populateMap();
      } else {
        map.once('load', populateMap);
      }
    }
  }

  function loadData(url, field, callback) {
    remaining++;
    fetch.json(url, function(obj) {
      data[field] = obj;
      if (typeof callback === 'function') {
        callback(obj);
      }
      handleLoaded();
    });
  }

  loadData('locations.json', 'locations');
  loadData('timeseries.json', 'timeseries');
  loadData('features.json', 'features');
}

export default showMap;
