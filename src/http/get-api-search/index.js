const lunr = require('lunr');
// eslint-disable-next-line
const index = lunr.Index.load(require('./dist/search.json'));
// eslint-disable-next-line
const locationMap = require('./dist/location-map-barebones.json');

exports.handler = async function http(req) {
  let items = [];

  const value = req.queryStringParameters.q;

  if (value) {
    if (value.length > 1) {
      const searchParam = value
        .trim()
        .toLowerCase()
        .split(' ')
        .map(term => `${term}* ${term}`)
        .join(' ');
      try {
        items = index.search(searchParam);
      } catch (err) {
        console.err('Error searching %s', err);
      }
    }
  }

  // Add in the juicy deets
  items = items.slice(0, 25).map(result => {
    return {
      slug: result.ref,
      score: result.score,
      ...locationMap[result.ref]
    };
  });

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(items)
  };
};
