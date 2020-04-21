/* globals window */

import * as fetch from './lib/fetch.js';
import showGraph from './location-graph.js';

window.showGraph = async function({ location }) {
  const timeseries = await fetch.json(`/api/timeseries/${location.slug}`);

  showGraph({
    timeseries,
    location
  });
};
