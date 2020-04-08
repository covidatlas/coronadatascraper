/* global document, window, history */
/* eslint guard-for-in: "off" */
/* eslint no-restricted-globals: "off" */

import '@adobe/focus-ring-polyfill';
import './style.css';

import showMap from './map.js';
import showFile from './file.js';
import showSources from './sources.js';
import showCrossCheckReport from './cross-check-report.js';

const pages = {
  '#home': '.cds-Home',
  '#editor': '.cds-FileEditor',
  '#sources': '.cds-Sources',
  '#crosscheck': '.cds-CrossCheckReports',
  '#features.json': '.cds-Map'
};

const routes = {
  '#sources': showSources,
  '#crosscheck': showCrossCheckReport,
  '#home': function() {},
  '#features.json': showMap
};

let sidebar;
let overlay;
let currentPage = null;

function openSidebar() {
  sidebar.classList.add('is-open');
  overlay.classList.add('is-open');
}

function closeSidebar() {
  sidebar.classList.remove('is-open');
  overlay.classList.remove('is-open');
}

function showPage(pageToShow, noPush) {
  // Set selected
  const currentSideLink =
    document.querySelector(`.spectrum-SideNav-item a[href="${pageToShow}"]`) ||
    document.querySelector(`.spectrum-SideNav-item a[href="${pageToShow.replace('#', '')}"]`);
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

  document.body.classList.remove('is-editing');

  if (routes[pageToShow]) {
    if (!noPush) {
      history.pushState(null, '', pageToShow);
    }
    routes[pageToShow]();
  }

  currentPage = pageToShow;

  closeSidebar();
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
      showPage('#editor');
      showFile(window.location.hash.substr(1), null, true);
    }
  } else {
    showPage('#home', false);
  }
}

window.addEventListener('hashchange', handleHashChange, false);

document.addEventListener('click', function(evt) {
  // Sidebar
  const button = evt.target.closest('button');
  if (button && button.classList.contains('js-toggleMenu')) {
    openSidebar();
  }

  if (evt.target.closest('.spectrum-Site-overlay')) {
    closeSidebar();
  }

  // Navigation
  const target = evt.target.closest('a');
  if (target) {
    if (target.tagName === 'A' && target.hasAttribute('download') && !target.hasAttribute('data-noview')) {
      // Stop download
      evt.preventDefault();

      const url = target.getAttribute('href');
      if (url === 'features.json') {
        showPage('#features.json');
      } else {
        showPage('#editor');
        showFile(url, target.getAttribute('data-levels'));
      }
    } else if (target.tagName === 'A' && routes[target.getAttribute('href')]) {
      // Stop download
      evt.preventDefault();

      showPage(target.getAttribute('href'));
    }
  }
});

document.addEventListener('DOMContentLoaded', function() {
  sidebar = document.querySelector('.spectrum-Site-sideBar');
  overlay = document.querySelector('.spectrum-Site-overlay');

  // Init
  handleHashChange();
});
