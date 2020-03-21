import path from 'path';

// Generate ratings
const sourceProps = ['rating', 'city', 'county', 'state', 'country', 'type', 'timeseries', 'headless', 'aggregate', 'ssl', 'priority', 'url', 'curators', 'sources', 'maintainers'];

/*
  Calculate the rating of a source
    info.type - the way the source presents data (see below)
    info.timeseries - true if timeseries provided, false if just latest
    info.$ - Each of the location fields defined by the source
    info.ssl - Whether the site has valid SSL (set to false if we have to work around it with certs)
    info.aggregate - String; one of city, county, state, country
    info.headless - Whether we need a headless browser to scrape this source
*/
function calculateRating(info) {
  const easeOfRead = {
    json: 1,
    csv: 1,
    table: 0.75,
    list: 0.5,
    paragraph: -1,
    pdf: -2,
    image: -3
  };

  const timeseries = {
    false: 0, // everyone's got the latest
    true: 1.75 // but timeseries is worth a lot
  };

  const completeness = {
    cases: 0.5,
    tested: 1,
    deaths: 1,
    recovered: 1,
    country: 0.5,
    state: 0.5,
    county: 1,
    city: 0.5
  };

  const aggregateWorth = 1.5;
  const headlessWorth = -0.5;
  const sslWorth = 0.25;

  // Give credit for completeness
  let rating = 0;
  for (const field in completeness) {
    if (info[field] !== null && info[field] !== undefined) {
      rating += completeness[field];
    }
  }

  // Auto-detect JSON and CSV
  if (!info.type && easeOfRead[path.extname(info.url).substr(1)]) {
    info.type = path.extname(info.url).substr(1);
  }

  if (info.url.substr(0, 5) === 'https' && info.certValidation !== false) {
    info.ssl = true;
    rating += sslWorth;
  }

  // Dock some points if we have to go headless
  if (info.headless) {
    rating += headlessWorth;
  }

  // Aggregate sources are gold
  if (info.aggregate) {
    rating += aggregateWorth;

    // Give points for what that data contains (higher level should already be given above)
    rating += completeness[info.aggregate];
  }

  // Assume it's a list
  if (!info.type) {
    info.type = 'list';
  }
  rating += easeOfRead[info.type];

  rating += timeseries[!!info.timeseries];

  // Calculate highest possible rating
  const possible =
    Object.values(completeness).reduce((a, v) => a + v, 0) +
    timeseries.true +
    aggregateWorth +
    Object.values(easeOfRead)
      .sort()
      .pop();

  return rating / possible;
}

const rateLocations = args => {
  const { locations } = args;

  const sourcesByURL = {};
  for (const location of locations) {
    const sourceObj = { ...location._scraperDefinition };
    for (const prop of sourceProps) {
      if (location[prop] !== undefined) {
        sourceObj[prop] = location[prop];
      }
    }
    for (const prop in sourceObj) {
      if (prop[0] === '_') {
        delete sourceObj[prop];
      }
    }

    delete sourceObj.scraper;

    // Remove granularity from the data since this is a report on the scraper
    if (sourceObj.aggregate) {
      delete sourceObj[sourceObj.aggregate];
    }

    sourcesByURL[location.url] = sourceObj;
    sourceObj.rating = calculateRating(sourceObj);
    location.rating = calculateRating(sourceObj);
  }
  let sourceRatings = Object.values(sourcesByURL);
  sourceRatings = sourceRatings.sort((a, b) => {
    return b.rating - a.rating;
  });

  return { ...args, sourceRatings };
};

export default rateLocations;
