/* globals window, document */

import * as fetch from './lib/fetch.js';

const searchField = document.querySelector('#searchField');
const searchButton = document.querySelector('#searchButton');

function search(query, callback) {
  const searchQuery = query || searchField.value.toLowerCase();
  fetch.json(`/api/locations?q=${encodeURIComponent(searchQuery)}`, searchResults => {
    if (typeof callback === 'function') {
      callback(searchResults);
    }
  });
}

function navigate(slug) {
  window.location = `/${slug}`;
}

function handleSubmit() {
  // Perform search and go to the first result
  search(null, results => {
    navigate(results[0].slug);
  });
}

searchField.addEventListener('input', search);
searchField.addEventListener('submit', handleSubmit);
searchButton.addEventListener('click', handleSubmit);
