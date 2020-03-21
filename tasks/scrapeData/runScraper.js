import * as datetime from '../../lib/datetime.js';
import * as geography from '../../lib/geography.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths', 'active'];

/*
  Combine location information with the passed data object
*/
function addLocationToData(data, location) {
  Object.assign(data, location);

  delete data.scraper;

  // Store for usage in ratings
  data._scraperDefinition = location;

  return data;
}

/*
  Check if the provided data contains any invalid fields
*/
function isValid(data) {
  if (data.cases === undefined) {
    throw new Error(`Invalid data: contains no case data`);
  }

  for (const [prop, value] of Object.entries(data)) {
    if (value === null) {
      throw new Error(`Invalid data: ${prop} is null`);
    }
    if (Number.isNaN(value)) {
      throw new Error(`Invalid data: ${prop} is not a number`);
    }
  }

  for (const prop of numericalValues) {
    if (data[prop] !== undefined && typeof data[prop] !== 'number') {
      throw new Error(`Invalid data: ${prop} is not a number`);
    }
  }

  return true;
}

/*
  Add output data to the cases array. Input can be either an object or an array
*/
function addData(cases, location, result) {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      throw new Error(`Invalid data: scraper for ${geography.getName(location)} returned 0 rows`);
    }
    for (const data of result) {
      if (isValid(data, location)) {
        cases.push(addLocationToData(data, location));
      }
    }
  } else if (isValid(result, location)) {
    cases.push(addLocationToData(result, location));
  }
}

/*
  Run the correct scraper for this location
*/
export function runScraper(location) {
  const rejectUnauthorized = location.certValidation === false;
  if (rejectUnauthorized) {
    // Important: this prevents SSL from failing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  if (typeof location.scraper === 'function') {
    return location.scraper();
  }
  if (rejectUnauthorized) {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  if (typeof location.scraper === 'object') {
    // Find the closest date
    const targetDate = process.env.SCRAPE_DATE || datetime.getDate();
    let scraperToUse = null;
    for (const [date, scraper] of Object.entries(location.scraper)) {
      if (datetime.dateIsBeforeOrEqualTo(date, targetDate)) {
        scraperToUse = scraper;
      }
    }
    if (scraperToUse === null) {
      throw new Error(`Could not find scraper for ${geography.getName(location)} at ${process.env.SCRAPE_DATE}, only have: ${Object.keys(location.scraper).join(', ')}`);
    }
    return scraperToUse.call(location);
  }

  throw new Error('Why on earth is the scraper for %s a %s?', geography.getName(location), typeof scraper);
}

const runScrapers = async args => {
  const { sources, options } = args;

  const locations = [];
  const errors = [];
  for (const location of sources) {
    if (options.location && geography.getName(location) !== options.location) {
      continue;
    }
    if (options.skip && geography.getName(location) === options.skip) {
      continue;
    }
    if (location.scraper) {
      try {
        addData(locations, location, await runScraper(location));
      } catch (err) {
        console.error('  ❌ Error processing %s: ', geography.getName(location), err);

        errors.push({
          name: geography.getName(location),
          url: location.url,
          err: err.toString()
        });
      }
    }
  }

  return { ...args, locations, scraperErrors: errors };
};

export default runScrapers;
