import path from 'path';
import * as geography from '../../../shared/lib/geography/index.js';
import reporter from '../../../shared/lib/error-reporter.js';
import runScraper from '../../../shared/lib/run-scraper.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths', 'active'];

/*
  Check if the provided data contains any invalid fields
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
      if (isValid(data, location)) {
        cases.push({ ...location, ...data });
      }
    }
  } else if (isValid(result, location)) {
    cases.push({ ...location, ...result });
  }
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
