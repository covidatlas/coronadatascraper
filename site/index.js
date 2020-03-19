/* global document, XMLHttpRequest, window, history, mapboxgl, Handsontable, Papa, JSONFormatter, d3 */
/* eslint no-use-before-define: "off" */
/* eslint guard-for-in: "off" */
/* eslint no-new: "off" */
/* eslint no-restricted-globals: "off" */
/* eslint no-useless-escape: "off" */

const data = {};
let map;

const noCasesColor = 'rgba(255, 255, 255, 0.5)';
const choroplethColors = ['#eeffcd', '#b4ffa5', '#ffff00', '#ff7f00', '#ff0000'];

const choroplethStyles = {
  pureRatio(location, locationData, type, rank, totalRanked, worstAffectedPercent) {
    // Color based on how bad it is, relative to the worst place
    const percentRatio = locationData[type] / location.population / worstAffectedPercent;

    return adjustTanh(percentRatio);
  },
  rankAdjustedRatio(location, locationData, type, rank, totalRanked, worstAffectedPercent) {
    // Color based on rank
    const rankRatio = (totalRanked - rank) / totalRanked;

    // Color based on how bad it is, relative to the worst place
    const percentRatio = locationData[type] / location.population / worstAffectedPercent;

    const ratio = (rankRatio + percentRatio) / 2;

    return ratio;
  },
  rankRatio(location, locationData, type, rank, totalRanked) {
    // Color based on rank
    const rankRatio = (totalRanked - rank) / totalRanked;

    return rankRatio;
  }
};

// Via https://math.stackexchange.com/a/57510
function adjustTanh(value, a = 0.1, b = 1.75) {
  return Math.min(Math.tanh(value + a) * b, 1);
}

function getLocationsByRank(currentData, type, min = 3) {
  let rankedItems = [];

  for (const locationId in currentData) {
    const locationData = currentData[locationId];
    const location = data.locations[locationId];

    if (this.shouldSkipLocation(location)) {
      continue;
    }

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

  const locations = [];
  for (const rankedItem of rankedItems) {
    locations.push(data.locations[rankedItem.locationId]);
  }

  return locations;
}

function getColorOnGradient(colors, position) {
  if (position === 1) {
    return colors[colors.length - 1];
  }
  if (position === 0) {
    return colors[0];
  }

  const index = Math.floor(position * (colors.length - 1));
  const startColor = colors[index];
  const endColor = colors[index + 1];
  const alpha = position * (colors.length - 1) - index;
  return d3.interpolateRgb(startColor, endColor)(alpha);
}

function shouldSkipLocation(location) {
  if (!location) {
    return true;
  }

  if (
    // Skip States, we have county data
    (location.country === 'USA' && location.state && !location.county) ||
    // Skip Italy; we have province data
    (location.country === 'ITA' && !location.state) ||
    // Skip Italy; we have province data
    (location.country === 'FRA' && !location.state) ||
    // Skip Italy; we have province data
    (location.country === 'ESP' && !location.state) ||
    // Breaks France
    location.country === 'REU' ||
    location.country === 'MTQ' ||
    location.country === 'GUF'
  ) {
    return true;
  }
  return false;
}

function populateMap() {
  const choroplethStyle = 'rankAdjustedRatio';
  const type = 'cases';
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
          color = getColorOnGradient(choroplethColors, scaledColorValue);
        }
      }
    }

    if (shouldSkipLocation(location)) {
      feature.properties.color = 'rgba(0,0,0,0.1)';
    } else {
      feature.properties.color = color || '#AAAAAA';
    }
  });

  console.log('Found locations for %d of %d features', foundFeatures, data.features.features.length);

  const smallFeatures = {
    type: 'FeatureCollection',
    features: data.features.features
  };

  map.addSource('CDSStates', {
    type: 'geojson',
    data: smallFeatures
  });

  map.addLayer({
    id: 'CDSStates',
    type: 'fill',
    source: 'CDSStates',
    layout: {},
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.75]
    }
  });

  // Create a popup, but don't add it to the map yet.
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  function getFeatureGranularity(feature) {
    let granularity = 0;
    const location = data.locations[feature.properties.locationId];
    if (location.country) granularity++;
    if (location.state) granularity++;
    if (location.county) granularity++;
    if (location.city) granularity++;
    return granularity;
  }

  let hoveredStateId = null;
  // When the user moves their mouse over the state-fill layer, we'll update the
  // feature state for the feature under the mouse.
  map.on('mousemove', 'CDSStates', function(e) {
    if (e.features.length > 0) {
      let feature = null;
      let featureGranularity = 0;

      for (const otherFeature of e.features) {
        const otherFeatureGranularity = getFeatureGranularity(otherFeature);
        if (otherFeatureGranularity > featureGranularity) {
          feature = otherFeature;
          featureGranularity = otherFeatureGranularity;
        }
      }

      if (hoveredStateId) {
        map.setFeatureState({ source: 'CDSStates', id: hoveredStateId }, { hover: false });
      }

      const { locationId } = feature.properties;

      const location = data.locations[locationId] || {};

      const locationData = currentData[locationId];

      hoveredStateId = feature.id;
      map.setFeatureState({ source: 'CDSStates', id: hoveredStateId }, { hover: true });

      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = 'pointer';

      // Populate the popup and set its coordinates
      // based on the feature found.
      popup
        .setLngLat(e.lngLat)
        .setHTML(popupTemplate(location, locationData, feature))
        .addTo(map);
    }
  });

  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', 'CDSStates', function() {
    map.getCanvas().style.cursor = '';
    popup.remove();
    if (hoveredStateId) {
      map.setFeatureState({ source: 'CDSStates', id: hoveredStateId }, { hover: false });
    }
    hoveredStateId = null;
  });
}

function popupTemplate(location, locationData) {
  let htmlString = `<div class="cds-Popup">`;
  htmlString += `<h6 class="spectrum-Heading spectrum-Heading--XXS">${location.name}</h6>`;
  if (location.population) {
    htmlString += `<p class="spectrum-Body spectrum-Body--XS"><strong>Population:</strong> ${location.population.toLocaleString()}</p>`;
  }
  if (locationData.cases) {
    htmlString += `<p class="spectrum-Body spectrum-Body--XS"><strong>Cases:</strong> ${locationData.cases.toLocaleString()}</p>`;
  }
  if (locationData.deaths) {
    htmlString += `<p class="spectrum-Body spectrum-Body--XS"><strong>Deaths:</strong> ${locationData.deaths.toLocaleString()}</p>`;
  }
  if (locationData.recovered) {
    htmlString += `<p class="spectrum-Body spectrum-Body--XS"><strong>Recovered:</strong> ${locationData.recovered.toLocaleString()}</p>`;
  }
  if (locationData.active !== locationData.cases) {
    htmlString += `<p class="spectrum-Body spectrum-Body--XS"><strong>Active:</strong> ${locationData.active.toLocaleString()}</p>`;
  }
  htmlString += `</div>`;
  return htmlString;
}

function showMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoibGF6ZCIsImEiOiJjazd3a3VoOG4wM2RhM29rYnF1MDJ2NnZrIn0.uPYVImW8AVA71unqE8D8Nw';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/lazd/ck7wkzrxt0c071ip932rwdkzj',
    center: [-121.403732, 40.492392],
    zoom: 5
  });

  let remaining = 0;
  function loadData(url, field, callback) {
    remaining++;
    fetchJSON(url, function(obj) {
      data[field] = obj;
      if (typeof callback === 'function') {
        callback(obj);
      }
      handleLoaded();
    });
  }

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

  loadData('locations.json', 'locations');
  loadData('timeseries.json', 'timeseries');
  loadData('features.json', 'features');
}

document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.spectrum-Site-sideBar');
  const overlay = document.querySelector('.spectrum-Site-overlay');

  const pages = {
    '#home': '.cds-Home',
    '#editor': '.cds-FileEditor',
    '#sources': '.cds-Sources',
    '#features.json': '.cds-Map'
  };

  const routes = {
    '#sources': showSources,
    '#home': function() {},
    '#features.json': showMap
  };

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }

  // Todo make this site less crappy and don't copy paste this
  function getName(location) {
    let name = '';
    let sep = '';
    if (location.city) {
      name += location.city;
      sep = ', ';
    }
    if (location.county) {
      name += sep + location.county;
      sep = ', ';
    }
    if (location.state) {
      name += sep + location.state;
      sep = ', ';
    }
    if (location.country) {
      name += sep + location.country;
      sep = ', ';
    }
    return name;
  }

  function getGrade(rating) {
    rating *= 200;

    if (rating >= 97) {
      return 'A+';
    }
    if (rating >= 93) {
      return 'A';
    }
    if (rating >= 90) {
      return 'A-';
    }
    if (rating >= 87) {
      return 'B+';
    }
    if (rating >= 83) {
      return 'B';
    }
    if (rating >= 80) {
      return 'B-';
    }
    if (rating >= 77) {
      return 'C+';
    }
    if (rating >= 73) {
      return 'C';
    }
    if (rating >= 70) {
      return 'C-';
    }
    if (rating >= 67) {
      return 'D+';
    }
    if (rating >= 63) {
      return 'D';
    }
    if (rating >= 60) {
      return 'D';
    }
    if (rating >= 57) {
      return 'F+';
    }
    if (rating >= 53) {
      return 'F';
    }
    if (rating >= 50) {
      return 'F';
    }
    return 'F-';
  }

  function ratingTemplate(source, index) {
    const typeIcons = {
      json: '✅',
      csv: '✅',
      table: '⚠️',
      list: '❌',
      paragraph: '🤮'
    };
    const typeNames = {
      json: 'JSON',
      csv: 'CSV'
    };

    let granular = source.city || source.county;
    let granularity = 'country-level';
    if (source.city || source.aggregate === 'city') {
      granularity = 'city-level';
      granular = true;
    } else if (source.county || source.aggregate === 'county') {
      granularity = 'county-level';
      granular = true;
    } else if (source.state || source.aggregate === 'state') {
      granularity = 'state-level';
    }

    const sourceName = source.url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/)[1];
    const slug = `sources:${getName(source)
      .replace(/,/g, '-')
      .replace(/\s/g, '')}`;

    return `
    <li class="cds-ReportCard" id="${slug}">
      <div class="cds-ReportCard-grade cds-ReportCard-grade--${getGrade(source.rating).replace(/[^A-Z]+/g, '')}">${getGrade(source.rating).replace(/([\+\-])/, '<span class="cds-ReportCard-plusMinus">$1</span>')}</div>
      <div class="cds-ReportCard-content">
        <h2 class="spectrum-Heading spectrum-Heading--L"><a href="#${slug}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${index + 1}. ${getName(source)}</a></h2>
        <h3 class="spectrum-Body spectrum-Body--XL"><a href="${source.url}" class="spectrum-Link" target="_blank">${sourceName}</a></h3>
        <div class="cds-ReportCard-criteria">
          <div class="cds-ReportCard-criterion">
            ${typeIcons[source.type]} ${typeNames[source.type] || source.type.substr(0, 1).toUpperCase() + source.type.substr(1)}
          </div>
          <div class="cds-ReportCard-criterion">
            ${source.timeseries ? '✅' : '❌'} Timeseries
          </div>
          <div class="cds-ReportCard-criterion">
            ${source.aggregate ? '✅' : '❌'} Aggregate
          </div>
          <div class="cds-ReportCard-criterion">
            ${source.ssl ? '✅' : '❌'} SSL
          </div>
          <div class="cds-ReportCard-criterion">
            ${source.headless ? '❌' : '✅'} ${source.headless ? 'Requires' : ' Does not require'} JavaScript
          </div>
          <div class="cds-ReportCard-criterion">
            ${granular ? '✅' : '❌'} Granularity (${granularity})
          </div>
        </div>
      </div>
    </li>
`;
  }

  function showSources() {
    const list = document.querySelector('.cds-Sources-list');
    fetchJSON('ratings.json', function(ratings) {
      list.innerHTML = '';
      for (let i = 0; i < ratings.length; i++) {
        list.insertAdjacentHTML('beforeend', ratingTemplate(ratings[i], i));
      }
      if (window.location.hash.indexOf(':') !== -1) {
        document.getElementById(window.location.hash.substr(1)).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  let currentPage = null;
  function showPage(pageToShow, noPush) {
    // Set selected
    const currentSideLink = document.querySelector(`.spectrum-SideNav-item a[href="${pageToShow}"]`);
    const currentSideItem = currentSideLink && currentSideLink.closest('.spectrum-SideNav-item');
    const otherSideItem = document.querySelector('.spectrum-SideNav-item.is-selected');
    if (otherSideItem) {
      otherSideItem.classList.remove('is-selected');
    }
    if (currentSideItem) {
      currentSideItem.classList.add('is-selected');
    }

    for (const page in pages) {
      const selector = pages[page];
      if (page === pageToShow) {
        document.querySelector(selector).hidden = false;
      } else {
        document.querySelector(selector).hidden = true;
      }
    }

    if (routes[pageToShow]) {
      if (!noPush) {
        history.pushState(null, '', pageToShow);
      }
      routes[pageToShow]();
    }

    currentPage = pageToShow;

    closeSidebar();
  }

  function loadFile(url, dataLevels, noPush) {
    document.body.classList.add('is-editing');

    const editor = document.querySelector('.cds-FileEditor');

    fetchURL(url, function() {
      editor.querySelector('.cds-Heading').innerText = url;

      const extension = url.split('.').pop();

      showPage('#editor');
      editor.querySelector('.cds-Editor-download').href = url;
      if (extension === 'json') {
        let obj;
        try {
          obj = JSON.parse(this.responseText);
        } catch (error) {
          editor.querySelector('.cds-FileEditor-content').innerHTML = `<div class="cds-Error">Failed to load ${url}: ${error}</div>`;
          return;
        }
        const formatter = new JSONFormatter(obj, dataLevels || 1);

        editor.querySelector('.cds-Editor-content').innerHTML = '<div class="cds-Editor-JSON"></div>';
        editor.querySelector('.cds-Editor-content').firstElementChild.appendChild(formatter.render());
      } else {
        const parsedData = Papa.parse(this.responseText, {
          header: true,
          skipEmptyLines: true
        });

        editor.querySelector('.cds-Editor-content').innerHTML = '';
        new Handsontable(editor.querySelector('.cds-Editor-content'), {
          data: parsedData.data,
          rowHeaders: true,
          colHeaders: parsedData.meta.fields,
          columnSorting: true,
          licenseKey: 'non-commercial-and-evaluation'
        });
      }

      // Select menu item
      const previousItem = editor.querySelector('.spectrum-SideNav-item.is-selected');
      if (previousItem) {
        previousItem.classList.remove('is-selected');
      }

      document
        .querySelector(`a[href="${url}"]`)
        .closest('.spectrum-SideNav-item')
        .classList.add('is-selected');
    });

    if (!noPush) {
      history.pushState(null, '', `#${url}`, '');
    }
  }

  function getHashStart() {
    return window.location.hash.split(':')[0];
  }

  function handleHashChange() {
    if (window.location.hash) {
      if (routes[getHashStart()]) {
        if (currentPage !== getHashStart()) {
          showPage(getHashStart(), true);
        }
      } else if (window.location.hash.match('.csv') || window.location.hash.match('.json')) {
        loadFile(window.location.hash.substr(1), null, true);
      }
    } else {
      showPage('#home', false);
    }
  }

  window.addEventListener('hashchange', handleHashChange, false);

  document.addEventListener('click', function(evt) {
    const button = evt.target.closest('button');
    if (button && button.classList.contains('js-toggleMenu')) {
      openSidebar();
    }

    if (evt.target.closest('.spectrum-Site-overlay')) {
      closeSidebar();
    }
  });

  document.addEventListener('click', function(evt) {
    const target = evt.target.closest('a');
    if (target) {
      if (target.tagName === 'A' && target.hasAttribute('download') && !target.hasAttribute('data-noview')) {
        // Stop download
        evt.preventDefault();

        const url = target.getAttribute('href');
        if (url === 'features.json') {
          showPage('#features.json');
        } else {
          loadFile(url, target.getAttribute('data-levels'));
        }
      } else if (target.tagName === 'A' && routes[target.getAttribute('href')]) {
        // Stop download
        evt.preventDefault();

        showPage(target.getAttribute('href'));
      }
    }
  });

  // Init
  handleHashChange();
});

// / Duplicated stuff because we don't have a bundler

function fetchURL(url, callback) {
  const req = new XMLHttpRequest();
  req.addEventListener('load', callback);
  req.open('GET', url);
  req.send();
  return req;
}

function fetchJSON(url, callback) {
  return fetchURL(url, function() {
    let obj;
    try {
      obj = JSON.parse(this.responseText);
    } catch (err) {
      console.error('Failed to parse JSON from %s: %s', url, err);
    }
    callback(obj);
  });
}
