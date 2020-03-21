/* globals mapboxgl */

// import * as mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import * as d3interpolate from 'd3-interpolate';
import * as d3scale from 'd3-scale';
import * as fetch from './lib/fetch.js';

import { adjustTanh, normalizePercent, getRatio } from './lib/math.js';
import { getLightness } from './lib/color.js';
import { isCounty, isState, isCountry, getLocationGranularityName } from '../lib/geography.js';

mapboxgl.accessToken = 'pk.eyJ1IjoibGF6ZCIsImEiOiJjazd3a3VoOG4wM2RhM29rYnF1MDJ2NnZrIn0.uPYVImW8AVA71unqE8D8Nw';

const data = {};

let map;

const noCasesColor = '#faffef';
const noPopulationDataColor = '#ffffff';

const outlineColorHighlight = 'rgb(0,0,0)';
const outlineColor = 'rgba(0, 0, 0, 0.3)';

const choroplethColors = {
  stoplight: ['#eeffcd', '#b4ffa5', '#ffff00', '#ff7f00', '#ff0000'],
  yellowOrangePurple: ['#faffef', '#f3fac1', '#f6f191', '#ffe15d', '#fec327', '#ff9b00', '#fe7000', '#fa4d13', '#c52155', '#842e79'],
  heat: ['#FFFFFF', '#ffff5e', '#ffe70c', '#fead0a', '#fd6f08', '#fd2907', '#fd0407'],
  peach: ['rgb(253,222,166)', 'rgb(255,188,134)', 'rgb(249,152,133)', 'rgb(232,110,129)', 'rgb(224,88,136)'],
  pink: ['rgb(255, 244, 221)', 'rgb(255, 221, 215)', 'rgb(255, 197, 210)', 'rgb(254, 174, 203)', 'rgb(250, 150, 196)', 'rgb(245, 126, 189)', 'rgb(239, 100, 181)', 'rgb(232, 70, 173)', 'rgb(210, 56, 161)', 'rgb(187, 46, 150)', 'rgb(163, 36, 140)', 'rgb(138, 27, 131)', 'rgb(113, 22, 124)', 'rgb(86, 15, 116)', 'rgb(55, 11, 110)', 'rgb(0, 9, 104)'],
  viridis: ['#fde725', '#d8e219', '#addc30', '#84d44b', '#5ec962', '#3fbc73', '#28ae80', '#1fa088', '#21918c', '#26828e', '#2c728e', '#33638d', '#3b528b', '#424086', '#472d7b', '#48186a'],
  magma: ['#fcfdbf', '#fde2a3', '#fec488', '#fea772', '#fc8961', '#f56b5c', '#e75263', '#d0416f', '#b73779', '#9c2e7f', '#832681', '#6a1c81', '#51127c', '#36106b', '#1d1147', '#0a0822']
};

const choroplethColor = 'yellowOrangePurple';

let domainArray = [];
const colorsArray = choroplethColors[choroplethColor];
const lightnessArray = colorsArray.map(key => 1 - getLightness(key) / 100);

const max = Math.max(...lightnessArray);
const min = Math.min(...lightnessArray);

for (let i = 0; i < colorsArray.length; i++) {
  const l = lightnessArray[i]; // lightness value

  const y = normalizePercent(min, max, l);
  domainArray.push(Number(y.toFixed(2)));
}

domainArray = domainArray.sort();

const fill = d3scale
  .scaleLinear()
  .domain(domainArray)
  .range(colorsArray)
  .interpolate(d3interpolate.interpolateHcl);

const choroplethStyle = 'pureRatio';

const type = 'cases';

const choroplethStyles = {
  pureRatio(location, locationData, type, rank, totalRanked, worstAffectedPercent) {
    // Color based on how bad it is, relative to the worst place
    const affectedPercent = locationData[type] / location.population;
    const percentRatio = affectedPercent / worstAffectedPercent;

    return adjustTanh(percentRatio);
  },
  rankAdjustedRatio(location, locationData, type, rank, totalRanked, worstAffectedPercent) {
    // Color based on rank
    const rankRatio = (totalRanked - rank) / totalRanked;

    // Color based on how bad it is, relative to the worst place
    const percentRatio = locationData[type] / location.population / worstAffectedPercent;

    const ratio = (rankRatio * 0.75 + percentRatio) / 1.75;

    return ratio;
  },
  rankRatio(location, locationData, type, rank, totalRanked) {
    // Color based on rank
    const rankRatio = (totalRanked - rank) / totalRanked;

    return rankRatio;
  }
};

function getLocationsByRank(currentData, type, min = 3) {
  let rankedItems = [];

  for (const locationId of Object.keys(currentData)) {
    const locationData = currentData[locationId];
    const location = data.locations[locationId];

    if (location.population && locationData[type] >= min) {
      rankedItems.push({ locationId, rate: locationData[type] / location.population });
    }
  }

  rankedItems = rankedItems.sort((a, b) => {
    if (a.rate === b.rate) {
      return 0;
    }
    if (a.rate > b.rate) {
      return -1;
    }

    return 1;
  });

  return rankedItems.map(rankedItem => data.locations[rankedItem.locationId]);
}

function populateMap() {
  const currentDate = Object.keys(data.timeseries).pop();
  const currentData = data.timeseries[currentDate];

  const locationsByRank = getLocationsByRank(currentData, type, 1);

  let foundFeatures = 0;
  let worstAffectedPercent = 0;
  data.locations.forEach(function(location, index) {
    // Calculate worst affected percent
    if (location.population) {
      const locationData = currentData[index];
      if (locationData) {
        const infectionPercent = locationData.cases / location.population;
        if (infectionPercent > worstAffectedPercent) {
          worstAffectedPercent = infectionPercent;
        }
      }
    }
    // Associated the feature with the location
    if (location.featureId) {
      const feature = data.features.features[location.featureId];
      if (feature) {
        foundFeatures++;
        feature.properties.locationId = index;
      }
    }
  });

  data.features.features.forEach(function(feature, index) {
    feature.id = index;
    let color = null;
    const { locationId } = feature.properties;
    const location = data.locations[locationId];
    if (location && location.population) {
      const locationData = currentData[locationId];
      if (locationData) {
        if (locationData.cases === 0) {
          color = noCasesColor;
        } else {
          const rank = locationsByRank.indexOf(location);
          const scaledColorValue = choroplethStyles[choroplethStyle](location, locationData, type, rank, locationsByRank.length, worstAffectedPercent);
          color = fill(scaledColorValue);
        }
      }
    }

    feature.properties.color = color || noPopulationDataColor;
  });

  console.log('Found locations for %d of %d features', foundFeatures, data.features.features.length);

  function popupTemplate(location, locationData) {
    let htmlString = `<div class="cds-Popup">`;
    htmlString += `<h6 class="spectrum-Heading spectrum-Heading--XXS">${location.name}</h6>`;
    htmlString += `<table class="cds-Popup-table spectrum-Body spectrum-Body--XS"><tbody>`;
    if (location.population !== undefined) {
      htmlString += `<tr><th>Population:</th><td>${location.population.toLocaleString()}</td></tr>`;
    } else {
      htmlString += `<tr><th colspan="2">NO POPULATION DATA</th></tr>`;
    }
    if (location.population && locationData.cases) {
      htmlString += `<tr><th>Infected:</th><td>${getRatio(locationData.cases, location.population)}</td></tr>`;
    }
    if (locationData.cases !== undefined) {
      htmlString += `<tr><th>Cases:</th><td>${locationData.cases.toLocaleString()}</td></tr>`;
    }
    if (locationData.deaths !== undefined) {
      htmlString += `<tr><th>Deaths:</th><td>${locationData.deaths.toLocaleString()}</td></tr>`;
    }
    if (locationData.recovered !== undefined) {
      htmlString += `<tr><th>Recovered:</th><td>${locationData.recovered.toLocaleString()}</td></tr>`;
    }
    if (locationData.active !== locationData.cases) {
      htmlString += `<tr><th>Active:</th><td>${locationData.active.toLocaleString()}</td></tr>`;
    }
    htmlString += `</tbody></table>`;
    htmlString += `</div>`;
    return htmlString;
  }
  const countryFeatures = {
    type: 'FeatureCollection',
    features: data.features.features.filter(function(feature) {
      return isCountry(data.locations[feature.properties.locationId]);
    })
  };

  const stateFeatures = {
    type: 'FeatureCollection',
    features: data.features.features.filter(function(feature) {
      return isState(data.locations[feature.properties.locationId]);
    })
  };

  const countyFeatures = {
    type: 'FeatureCollection',
    features: data.features.features.filter(function(feature) {
      return isCounty(data.locations[feature.properties.locationId]);
    })
  };

  const paintConfig = {
    // 'fill-outline-color': 'rgba(255, 255, 255, 1)',
    'fill-color': ['get', 'color'],
    'fill-outline-color': ['case', ['boolean', ['feature-state', 'hover'], false], outlineColorHighlight, outlineColor],
    'fill-opacity': 1
  };

  map.addSource('CDS-country', {
    type: 'geojson',
    data: countryFeatures
  });

  map.addLayer({
    id: 'CDS-country',
    type: 'fill',
    source: 'CDS-country',
    layout: {},
    paint: paintConfig
  });

  map.addSource('CDS-state', {
    type: 'geojson',
    data: stateFeatures
  });

  map.addLayer({
    id: 'CDS-state',
    type: 'fill',
    source: 'CDS-state',
    layout: {},
    paint: paintConfig
  });

  map.addSource('CDS-county', {
    type: 'geojson',
    data: countyFeatures
  });

  map.addLayer({
    id: 'CDS-county',
    type: 'fill',
    source: 'CDS-county',
    layout: {},
    paint: paintConfig
  });

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
        .setHTML(popupTemplate(location, locationData, feature))
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
}

function showMap() {
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
