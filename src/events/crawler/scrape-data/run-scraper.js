import datetime from '../../../shared/lib/datetime/index.js';
import reporter from '../../../shared/lib/error-reporter.js';
import * as geography from '../../../shared/lib/geography/index.js';
import log from '../../../shared/lib/log.js';

// import { calculateScraperTz } from '../../../shared/lib/geography/timezone.js';

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
  Add output data to the cases array, input must be an object
*/
function processData(cases, location, data) {
  const caseInfo = { ...location, ...data };

  /*
  if (datetime.scrapeDate()) {
    // This must come from cache
    // caseInfo.collectedDate = datetime.scrapeDate();
  }
  else {
    // Add collection date as current UTC time
    // Even this is likely wrong -- it's gotta be cache aware
    caseInfo.collectedDate = (new Date()).toISOString();
  }
  */

  cases.push(caseInfo);
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
        processData(cases, location, data);
      }
    }
  } else if (isValid(result)) {
    processData(cases, location, result);
  }
}

/*
  Run the correct scraper for this location
*/
export async function runScraper(location) {
  const rejectUnauthorized = location.certValidation === false;
  if (rejectUnauthorized) {
    // Important: this prevents SSL from failing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  // scraperTz will be used by the cache PR
  // const scraperTz = await calculateScraperTz(location);

  if (typeof location.scraper === 'function') {
    return location.scraper();
  }
  if (rejectUnauthorized) {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  if (typeof location.scraper === 'object') {
    // Find the closest date
    let env;
    if (process.env.SCRAPE_DATE) env = datetime.parse(process.env.SCRAPE_DATE);
    const targetDate = env || datetime.getDate();

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
  const { sources } = args;

  const locations = [];
  const errors = [];
  for (const location of sources) {
    if (location.scraper) {
      try {
        log(`\n\n\nBegin scraper for ${geography.getName(location)}`);
        addData(locations, location, await runScraper(location));
        log(`Finished scraper for ${geography.getName(location)}\n\n\n`);
      } catch (err) {
        log.error('  ❌ Error processing %s: ', geography.getName(location), err);

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
