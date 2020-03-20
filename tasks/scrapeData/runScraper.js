import * as datetime from '../../lib/datetime.js';
import * as transform from '../../lib/transform.js';

/*
  Run the correct scraper for this location
*/
const runScraper = (source, targetDate) => {
  if (typeof source.scraper === 'function') {
    return source.scraper.call(source);
  }
  if (typeof source.scraper === 'object') {
    for (const [date, scraper] of Object.entries(source.scraper)) {
      if (datetime.dateIsBeforeOrEqualTo(date, targetDate)) {
        return scraper.call(source);
      }
    }
    throw new Error(`Could not find scraper for ${transform.getName(source)} at ${process.env.SCRAPE_DATE}, only have: ${Object.keys(source).join(', ')}`);
  } else {
    throw new Error(`Why on earth is the scraper for ${transform.getName(source)} a ${typeof source.scraper}?`);
  }
};

const runScrapers = async args => {
  const { date, sources, options } = args;

  const locations = [];

  for (const source of sources) {
    const rejectUnauthorized = source.certValidation === false;

    if (options.location) {
      if (transform.getName(source) !== options.location) {
        continue;
      }
    }
    if (options.skip) {
      if (transform.getName(source) === options.skip) {
        continue;
      }
    }

    if (rejectUnauthorized) {
      // Important: this prevents SSL from failing
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    try {
      const output = await runScraper(source, date);

      // Processing output
      if (Array.isArray(output)) {
        if (output.length > 0) {
          locations.push(...output.map(location => ({ ...source, ...location })));
        } else {
          throw new Error(`Invalid data: scraper for ${transform.getName(source)} returned 0 rows`);
        }
      } else if (typeof output === 'object' && output !== null) {
        locations.push({ ...source, ...output });
      } else if (output === null) {
        console.warn('Scraper has no data, skipped');
      } else {
        throw new Error(`Invalid data: scraper for ${transform.getName(source)} returned an unexpected output`);
      }
    } catch (e) {
      console.error('  ❌ Error scraping %s: ', transform.getName(source), e);
    }

    if (rejectUnauthorized) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
  }

  return { ...args, locations };
};

export default runScrapers;
