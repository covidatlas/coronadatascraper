/* globals window */

import showMap from './location-map.js';
import showGraph from './location-graph.js';
import * as fetch from './lib/fetch.js';

window.showLocation = async function({ parentSlug, location }) {
  const timeseries = await fetch.json(`/api/timeseries/${parentSlug}?level=${location.level}`);

  showGraph({
    timeseries,
    location
  });

  const locations = await fetch.json(`/api/locations/${parentSlug}?level=${location.level}`);
  const features = await fetch.json(`/api/features/${parentSlug}?level=${location.level}`);

  showMap({
    locations,
    features,
    timeseries
  });
};
