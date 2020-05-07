/* globals window */

import showMap from './location-map.js';
import showGraph from './location-graph.js';
import * as fetch from './lib/fetch.js';

window.showLocation = async function({ location, parentLocation }) {
  const timeseries = await fetch.json(`/api/timeseries/${location.slug}`);

  showGraph({
    timeseries,
    location
  });

  let targetSlug;
  let queryLevel;
  let center;
  let zoom = 2.5;

  if (location.country === 'United States') {
    // Special cases for US since we mix so many data sources
    if (location.level === 'county') {
      // View all counties within state, center on county
      center = location.coordinates;
      targetSlug = parentLocation.slug;
      queryLevel = 'county';
      zoom = 6;
    } else if (location.level === 'state') {
      // View all counties within state, center on state
      center = location.coordinates;
      targetSlug = location.slug;
      queryLevel = 'county';
      zoom = 4;
    } else {
      // View all states within country, center on country
      center = location.coordinates;
      targetSlug = location.slug;
      queryLevel = 'state';
    }
  } else if (parentLocation && parentLocation.aggregate === location.level) {
    // View children of parent
    center = parentLocation.coordinates;
    targetSlug = parentLocation.slug;
    queryLevel = location.aggregate;
  } else if (!parentLocation && location.aggregate) {
    // View children of location
    center = location.coordinates;
    targetSlug = location.slug;
    queryLevel = location.aggregate;
  } else {
    // View location itself
    center = location.coordinates;
    targetSlug = location.slug;
    queryLevel = location.level;
  }

  const mapTimeseries = await fetch.json(`/api/timeseries/${targetSlug}?level=${queryLevel}`);
  const locations = await fetch.json(`/api/locations/${targetSlug}?level=${queryLevel}`);
  const features = await fetch.json(`/api/features/${targetSlug}?level=${queryLevel}`);

  showMap({
    timeseries: mapTimeseries,
    locations,
    features,
    center,
    zoom
  });
};

window.showMap = showMap;
window.showGraph = showGraph;
