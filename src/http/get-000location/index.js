const arc = require('@architect/functions');

const sources = require('./dist/location-map.json');

// /:location
async function handle404(req) {
  // Read in the map
  // See if the slug matches
  const { pathParameters } = req;
  if (sources[pathParameters.location]) {
    return req;
  }

  return {
    statusCode: 404
  };
}

async function route() {
  // Display the information for the location
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: ``
  };
}

exports.handler = arc.http.async(handle404, route);
