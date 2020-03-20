/* global document, window, history, Handsontable, Papa, JSONFormatter */
/* eslint no-use-before-define: "off" */
/* eslint guard-for-in: "off" */
/* eslint no-new: "off" */
/* eslint no-restricted-globals: "off" */
/* eslint no-useless-escape: "off" */

import '@adobe/focus-ring-polyfill';

import './style.css';

import { getName } from '../lib/geography.js';

import showMap from './map.js';

import * as fetch from './lib/fetch.js';

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

  function getURLFromCurator(curator) {
    if (!curator) {
      return '';
    }

    let url;
    if (curator.url) {
      url = curator.url;
    } else if (curator.twitter) {
      url = `https://twitter.com/${curator.twitter.replace('@', '')}`;
    } else if (curator.github) {
      url = `https://github.com/${curator.github}`;
    } else if (curator.email) {
      url = `mailto:${curator.email}`;
    }
    return url;
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

    const sourceURLShort = source.url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/)[1];
    const slug = `sources:${getName(source)
      .replace(/,/g, '-')
      .replace(/\s/g, '')}`;

    const curators = getContributors(source.curators, 'Curated by');
    const sources = getContributors(source.sources, 'Sourced from');
    const maintainers = getContributors(source.maintainers, 'Maintained by');
    return `
    <li class="cds-ReportCard" id="${slug}">
      <div class="cds-ReportCard-grade cds-ReportCard-grade--${getGrade(source.rating).replace(/[^A-Z]+/g, '')}">${getGrade(source.rating).replace(/([\+\-])/, '<span class="cds-ReportCard-plusMinus">$1</span>')}</div>
      <div class="cds-ReportCard-content">
        <h2 class="spectrum-Heading spectrum-Heading--L"><a href="#${slug}" target="_blank" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${index + 1}. ${getName(source)}</a></h2>
        ${sources}
        ${curators}
        ${maintainers}
        <h4 class="spectrum-Body spectrum-Body--XL cds-ReportCard-sourceURL">Data from <a href="${source.url}" class="spectrum-Link" target="_blank">${sourceURLShort}</a></h4>
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

  function getContributors(contributors, byString) {
    let html = '';

    if (contributors) {
      html += `<h3 class="spectrum-Body spectrum-Body--XL cds-ReportCard-contributorName">${byString} `;
      for (const [index, contributor] of Object.entries(contributors)) {
        if (index !== '0') {
          html += ', ';
        }
        const contributorURL = getURLFromCurator(contributor);
        if (contributorURL) {
          html += `<a href="${getURLFromCurator(contributor)}" class="spectrum-Link">`;
        }
        html += contributor.name;
        if (contributorURL) {
          html += `</a>`;
        }
        if (contributor && (contributor.country || contributor.flag)) {
          html += ' ';
          html += contributor.flag ? contributor.flag : `(${contributor.country})`;
        }
      }
      html += `</h3>`;
    }

    return html;
  }

  function showSources() {
    const list = document.querySelector('.cds-Sources-list');
    fetch.json('ratings.json', function(ratings) {
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
    const currentSideLink = document.querySelector(`.spectrum-SideNav-item a[href="${pageToShow}"]`) || document.querySelector(`.spectrum-SideNav-item a[href="${pageToShow.replace('#', '')}"]`);
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

    fetch.url(url, function() {
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
