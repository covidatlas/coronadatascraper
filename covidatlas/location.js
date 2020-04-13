/* globals window */

import showMap from './location-map.js';
import showGraph from './location-graph.js';
import * as fetch from './lib/fetch.js';

window.showLocation = async function({ slug, parentSlug, location, center }) {
  // Get children if requesting a country
  const level = location.level === 'country' ? 'state' : location.level;

  const timeseries = await fetch.json(`/api/timeseries/${slug}`);

  showGraph({
    timeseries,
    location
  });

  const mapTimeseries = await fetch.json(`/api/timeseries/${parentSlug}?level=${level}`);
  const locations = await fetch.json(`/api/locations/${parentSlug}?level=${level}`);
  const features = await fetch.json(`/api/features/${parentSlug}?level=${level}`);

  showMap({
    timeseries: mapTimeseries,
    locations,
    features,
    center
  });
};
