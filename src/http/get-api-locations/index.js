const lunr = require('lunr');
const index = lunr.Index.load(require('./dist/search.json'));
const skinnyLocations = require('./dist/skinnyLocations.json');

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
  items = items.map(result => {
    return {
      slug: result.ref,
      score: result.score,
      ...skinnyLocations[result.ref]
    };
  });

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: JSON.stringify(items)
  };
};
