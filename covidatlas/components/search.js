/* globals window, document */

import { Overlay } from '@spectrum-web-components/overlay';
import * as fetch from '../lib/fetch.js';

const searchContainer = document.querySelector('#searchContainer');
const searchPopover = document.querySelector('#searchPopover');
const searchResults = document.querySelector('#searchResults');
const searchField = document.querySelector('#searchField');
const searchButton = document.querySelector('#searchButton');

// Returned by calls to Overlay.open
let closeOverlay;

async function search(query, callback) {
  const searchQuery = query || searchField.value.toLowerCase();
  const results = await fetch.json(`/api/search?q=${encodeURIComponent(searchQuery)}`);
  if (typeof callback === 'function') {
    callback(results);
  }
}

function showResults(results) {
  if (results.length) {
    searchResults.innerHTML = results.map(r => `<sp-menu-item href="/${r.slug}">${r.name}</sp-menu-item>`).join('\n');
  } else {
    searchResults.innerHTML = `<sp-menu-item disabled>No results found.</sp-menu-item>`;
  }

  searchPopover.style.width = `${searchField.offsetWidth}px`;

  closeOverlay = Overlay.open(searchField, 'click', searchPopover, {
    placement: 'bottom-start'
  });
}

function focusOnFirstItem() {
  const firstItem = searchResults.menuItems[0];
  if (firstItem && firstItem.focusElement) {
    firstItem.focusElement.focus();
  }
}

function navigate(slug) {
  window.location = `/${slug}`;
}

function handleSubmit(evt) {
  evt.preventDefault();

  // Perform search and go to the first result
  search(null, results => {
    showResults(results);

    if (results.length) {
      // Focus the item we're navigating to there's a tiny bit of visual feedback
      setTimeout(focusOnFirstItem, 0);
      navigate(results[0].slug);
    }
  });
}

function handleInput() {
  search(null, showResults);
}

function handleFocusout(evt) {
  if (evt.relatedTarget && !searchContainer.contains(evt.relatedTarget) && !searchPopover.contains(evt.relatedTarget)) {
    if (closeOverlay) {
      closeOverlay();
      closeOverlay = null;
    }
  }
}

function handleTabout(evt) {
  if (evt.key === 'ArrowDown' || evt.key === 'Tab') {
    focusOnFirstItem();
    evt.preventDefault();
  }
}

// Weaksauce accessibility
searchField.addEventListener('keydown', handleTabout);
searchButton.addEventListener('keydown', handleTabout);

searchContainer.addEventListener('focusout', handleFocusout);
searchField.addEventListener('input', handleInput);
searchField.addEventListener('submit', handleSubmit);
searchButton.addEventListener('click', handleSubmit);
