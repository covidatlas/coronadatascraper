import path from 'path';
import * as datetime from '../../../shared/lib/datetime.js';
import * as geography from '../../../shared/lib/geography/index.js';
import reporter from '../../../shared/lib/error-reporter.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths', 'active'];

/** Check if the provided data contains any invalid fields.
 * @param {any[]} data
 */
function isValid(data) {
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
      if (isValid(data)) {
        cases.push({ ...location, ...data });
      }
    }
  } else if (isValid(result)) {
    cases.push({ ...location, ...result });
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
      throw new Error(
        `Could not find scraper for ${geography.getName(location)} at ${
          process.env.SCRAPE_DATE
        }, only have: ${Object.keys(location.scraper).join(', ')}`
      );
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
    if (options.skip && geography.getName(location) === options.skip) {
      continue;
    }
    if (
      options.location &&
      path.basename(location._path, '.js') !== options.location &&
      geography.getName(location) !== options.location
    ) {
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
          type: err.name,
          err: err.toString()
        });

        reporter.logError('scraper failure', 'scraper failed', err.toString(), 'critical', location);
      }
    }
  }

  return { ...args, locations, scraperErrors: errors };
};

export default runScrapers;
