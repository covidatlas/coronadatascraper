/* globals mapboxgl, geojsonExtent, document, window */

// import * as mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import { getSource } from './lib/templates.js';
import { getRatio, getPercent } from './lib/math.js';
import * as color from './lib/color.js';

mapboxgl.accessToken = 'pk.eyJ1IjoibGF6ZCIsImEiOiJjazd3a3VoOG4wM2RhM29rYnF1MDJ2NnZrIn0.uPYVImW8AVA71unqE8D8Nw';

const data = {};

let map;

let currentType = 'cases';
let currentDate;
let currentData;

function navigate(slug) {
  window.location = `/${slug}`;
}

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

function findFeature(id) {
  return data.features.features.find(feature => feature.properties.id === id);
}

function findLocation(id) {
  return data.locations.find(location => location.id === id);
}

function initData() {
  let foundFeatures = 0;
  data.locations.forEach(function(location) {
    // Associated the feature with the location
    if (location.featureId !== undefined) {
      const feature = findFeature(location.featureId);
      if (feature) {
        foundFeatures++;
        feature.properties.locationId = location.id;
      } else {
        console.log('Failed to find feature for', location);
      }
    }
  });

  console.log('Found locations for %d of %d features', foundFeatures, data.features.features.length);
}

function updateMap(date, type) {
  currentType = type || 'cases';
  currentDate = date || Object.keys(data.timeseries).pop();
  currentData = data.timeseries[currentDate];

  let worstAffectedPercent = 0;
  let lowestInfectionPercent = Infinity;

  let chartDataMin;
  let chartDataMax;
  let lowestLocation = null;
  let highestLocation = null;

  data.locations.forEach(function(location) {
    // Calculate worst affected percent
    if (location.population) {
      const locationData = currentData[location.id];
      if (locationData) {
        const infectionPercent = locationData.cases / location.population;
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
    const location = findLocation(locationId);
    if (location && location.population) {
      const locationData = currentData[location.id];
      if (locationData) {
        if (locationData.cases === 0) {
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

  color.createLegend(chartDataMin, chartDataMax);
  map.getSource('CDS-features').setData(data.features);
}

function populateMap() {
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

  map.addSource('CDS-features', {
    type: 'geojson',
    data: null
  });

  map.addLayer(
    {
      id: 'CDS-features',
      type: 'fill',
      source: 'CDS-features',
      layout: {},
      paint: paintConfig
    },
    // Place layer underneath label layer of template map.
    labelLayerId
  );

  // Create a popup, but don't add it to the map yet.
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  let hoveredFeatureId = null;

  function getFeatureFromEvent(e) {
    if (e.features.length > 0) {
      const feature = e.features[0];

      const { locationId } = feature.properties || {};
      const location = findLocation(locationId) || {};
      const locationData = currentData[locationId] || {};
      return { locationId, location, feature, locationData };
    }
    return null;
  }

  function handleMouseLeave() {
    map.getCanvas().style.cursor = '';
    popup.remove();
    if (hoveredFeatureId) {
      map.setFeatureState({ source: 'CDS-features', id: hoveredFeatureId }, { hover: false });
    }
  }

  function handleMouseMove(e) {
    if (e.features.length > 0) {
      e.preventDefault();
      const { feature, location, locationData } = getFeatureFromEvent(e);

      if (hoveredFeatureId) {
        map.setFeatureState({ source: `CDS-features`, id: hoveredFeatureId }, { hover: false });
      }

      hoveredFeatureId = feature.id;

      if (hoveredFeatureId) {
        map.setFeatureState({ source: `CDS-features`, id: hoveredFeatureId }, { hover: true });
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

  function handleClick(e) {
    if (e.features.length > 0) {
      e.preventDefault();
      const { location } = getFeatureFromEvent(e);

      navigate(location.slug);
    }
  }

  // When the user moves their mouse over the state-fill layer, we'll update the
  // feature state for the feature under the mouse.
  map.on('mousemove', 'CDS-features', handleMouseMove);

  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', 'CDS-features', handleMouseLeave);

  map.on('click', 'CDS-features', handleClick);

  initData();
  updateMap();

  const bounds = geojsonExtent(data.features);

  map.fitBounds(new mapboxgl.LngLatBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]]), {
    padding: 50
  });
}

let rendered = false;
function showMap({ features, locations, timeseries, center = [-121.403732, 40.492392], zoom = 3 }) {
  if (rendered) {
    return;
  }
  rendered = true;

  data.timeseries = data.timeseries || timeseries;
  data.locations = data.locations || locations;
  data.features = data.features || features;

  document.body.classList.add('is-editing');

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/lazd/ck7wkzrxt0c071ip932rwdkzj',
    center,
    zoom
  });

  if (map.loaded()) {
    populateMap();
  } else {
    map.once('load', populateMap);
  }
}

export default showMap;
