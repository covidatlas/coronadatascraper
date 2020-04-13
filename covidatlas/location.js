/* globals window */

import showMap from './location-map.js';
import showGraph from './location-graph.js';
import * as fetch from './lib/fetch.js';

const levelMap = {
  // Show all states if requesting a country
  country: 'state',
  // Show all counties if requesting a state
  state: 'county'
};

window.showLocation = async function({ location, parentLocation }) {
  const timeseries = await fetch.json(`/api/timeseries/${location.slug}`);

  showGraph({
    timeseries,
    location
  });

  const level = levelMap[location.level] || location.level;
  const targetSlug = levelMap[location.level] ? location.slug : parentLocation.slug;
  const center = levelMap[location.level] ? location.coordinates : parentLocation.coordinates;
  const mapTimeseries = await fetch.json(`/api/timeseries/${targetSlug}?level=${level}`);
  const locations = await fetch.json(`/api/locations/${targetSlug}?level=${level}`);
  const features = await fetch.json(`/api/features/${targetSlug}?level=${level}`);

  showMap({
    timeseries: mapTimeseries,
    locations,
    features,
    center
  });
};
