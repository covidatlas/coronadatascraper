const arc = require('@architect/functions');

// eslint-disable-next-line
const timeseries = require('./dist/timeseries.json');
// eslint-disable-next-line
const locationMap = require('./dist/location-map.json');

// eslint-disable-next-line
const { handle404 } = require('@architect/views/lib/middleware');
// eslint-disable-next-line
const { filterTimeseriesByLocations } = require('@architect/views/lib/timeseries');

async function route(req) {
  const { location } = req;
  const subTimeseries = filterTimeseriesByLocations(timeseries, location);

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(subTimeseries)
  };
}

exports.handler = arc.http.async(handle404(locationMap), route);
