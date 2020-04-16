import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/old/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:CA-NS',
  country: 'iso1:CA',
  url: 'https://novascotia.ca/coronavirus/COVID-19-cases.csv',
  type: 'csv',
  certValidation: false,
  sources: [
    {
      name: 'Government of Nova Scotia',
      url: 'https://novascotia.ca/coronavirus/#cases'
    }
  ],
  scraper: {
    '0': async function() {
      const data = await fetch.csv(this, this.url, 'default');

      const headers = Object.keys(data[0]);
      if (headers[0] !== 'Date' || headers[1] !== 'Positive' || headers[2] !== 'Negative') {
        throw new Error('Unknown headers in CSV');
      }

      // FIXME when we roll out new TZ support!
      const fallback = process.env.USE_ISO_DATETIME ? new Date(datetime.now.at('America/Halifax')) : datetime.getDate();
      let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : fallback;
      let scrapeDateString = datetime.getYYYYMD(scrapeDate);
      const lastDateInTimeseries = new Date(`${data[data.length - 1].Date} 12:00:00`);
      const firstDateInTimeseries = new Date(`${data[0].Date} 12:00:00`);

      if (scrapeDate > lastDateInTimeseries) {
        console.error(
          `  🚨 timeseries for ${geography.getName(
            this
          )}: SCRAPE_DATE ${scrapeDateString} is newer than last sample time ${datetime.getYYYYMD(
            lastDateInTimeseries
          )}. Using last sample anyway`
        );
        scrapeDate = lastDateInTimeseries;
        scrapeDateString = datetime.getYYYYMD(scrapeDate);
      }

      if (scrapeDate < firstDateInTimeseries) {
        throw new Error(`Timeseries starts later than SCRAPE_DATE ${scrapeDateString}`);
      }

      for (const row of data) {
        if (datetime.getYYYYMD(`${row.Date} 12:00:00`) === scrapeDateString) {
          const pos = parse.number(row.Positive);
          const neg = parse.number(row.Negative);

          return {
            cases: pos,
            tested: pos + neg
          };
        }
      }
      throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${scrapeDateString}`);
    },
    '2020-04-12': async function() {
      this.url = 'https://novascotia.ca/coronavirus/data/COVID-19-data.csv';
      await fetch.csv(this, this.url, 'default');
      throw new Error('Someone needs to scrape this new data properly');
    }
  }
};

export default scraper;
