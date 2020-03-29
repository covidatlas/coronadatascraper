import * as datetime from './datetime.js';
import * as geography from './geography/index.js';

/*
  Run the correct scraper for this location
*/
export default function runScraper(source) {
  const locationName = geography.getName(source);
  // console.log(`
  //   🥄 Scraping ${locationName}
  //   `);

  const rejectUnauthorized = source.certValidation === false;
  if (rejectUnauthorized) {
    // Important: this prevents SSL from failing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  if (typeof source.scraper === 'function') {
    return source.scraper();
  }
  if (rejectUnauthorized) {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  if (typeof source.scraper === 'object') {
    // Find the closest date
    const targetDate = process.env.SCRAPE_DATE || datetime.getDate();
    let scraperToUse = null;
    for (const [date, scraper] of Object.entries(source.scraper)) {
      if (datetime.dateIsBeforeOrEqualTo(date, targetDate)) {
        scraperToUse = scraper;
      }
    }
    if (scraperToUse === null) {
      const keys = Object.keys(source.scraper).join(', ');
      throw new Error(`Could not find scraper for ${locationName} at ${process.env.SCRAPE_DATE}, only have: ${keys}`);
    }
    return scraperToUse.call(source);
  }

  throw new Error('Why on earth is the scraper for %s a %s?', locationName, typeof scraper);
}
