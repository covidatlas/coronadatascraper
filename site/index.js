/* global document, XMLHttpRequest, window, history, mapboxgl, Handsontable, Papa, JSONFormatter */
/* eslint no-use-before-define: "off" */
/* eslint guard-for-in: "off" */
/* eslint no-new: "off" */
/* eslint no-restricted-globals: "off" */
/* eslint no-useless-escape: "off" */

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
    '#features.json': function() {
      mapboxgl.accessToken = 'pk.eyJ1IjoibGF6ZCIsImEiOiJjazd3a3VoOG4wM2RhM29rYnF1MDJ2NnZrIn0.uPYVImW8AVA71unqE8D8Nw';
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/lazd/ck7wkzrxt0c071ip932rwdkzj',
        center: [-121.403732, 40.492392],
        zoom: 5
      });

      map.on('load', function() {
        fetchJSON('features.json', function(featureCollection) {
          const smallFeatures = {
            type: 'FeatureCollection',
            features: featureCollection.features.filter((feature, index) => {
              feature.id = index;
              return feature.properties.admin !== feature.properties.name;
            })
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
              'fill-color': '#627BC1',
              'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5]
            }
          });

          // Create a popup, but don't add it to the map yet.
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
          });

          let hoveredStateId = null;
          // When the user moves their mouse over the state-fill layer, we'll update the
          // feature state for the feature under the mouse.
          map.on('mousemove', 'CDSStates', function(e) {
            if (e.features.length > 0) {
              if (hoveredStateId) {
                map.setFeatureState({ source: 'CDSStates', id: hoveredStateId }, { hover: false });
              }
              hoveredStateId = e.features[0].id;
              map.setFeatureState({ source: 'CDSStates', id: hoveredStateId }, { hover: true });

              // Change the cursor style as a UI indicator.
              map.getCanvas().style.cursor = 'pointer';

              const description = e.features[0].properties.name;

              // Populate the popup and set its coordinates
              // based on the feature found.
              popup
                .setLngLat(e.lngLat)
                .setHTML(description)
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
        });
      });
    }
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
      .replace(',', '-')
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

  function fetch(url, callback) {
    const req = new XMLHttpRequest();
    req.addEventListener('load', callback);
    req.open('GET', url);
    req.send();
    return req;
  }

  function fetchJSON(url, callback) {
    return fetch(url, function() {
      let obj;
      try {
        obj = JSON.parse(this.responseText);
      } catch (err) {
        console.error('Failed to parse JSON from %s: %s', url, err);
      }
      callback(obj);
    });
  }

  function loadFile(url, dataLevels, noPush) {
    document.body.classList.add('is-editing');

    const editor = document.querySelector('.cds-FileEditor');

    fetch(url, function() {
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
        const data = Papa.parse(this.responseText, {
          header: true,
          skipEmptyLines: true
        });

        editor.querySelector('.cds-Editor-content').innerHTML = '';
        new Handsontable(editor.querySelector('.cds-Editor-content'), {
          data: data.data,
          rowHeaders: true,
          colHeaders: data.meta.fields,
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
