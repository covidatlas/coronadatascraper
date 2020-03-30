import datetime from '../../../src/shared/lib/datetime/index.js';
import * as geography from '../../../src/shared/lib/geography/index.js';

export default location => {
  location = location.default;
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

  throw new Error(`Why on earth is the scraper for ${geography.getName(location)} a ${typeof scraper}?`);
};
