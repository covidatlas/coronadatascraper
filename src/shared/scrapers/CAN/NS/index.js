import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'Nova Scotia',
  country: 'CAN',
  url: 'https://novascotia.ca/coronavirus/COVID-19-cases.csv',
  type: 'csv',
  certValidation: false,
  sources: [
    {
      name: 'Government of Nova Scotia',
      url: 'https://novascotia.ca/coronavirus/#cases'
    }
  ],
  async scraper() {
    const data = await fetch.csv(this.url);

    const headers = Object.keys(data[0]);
    if (headers[0] !== 'Date' || headers[1] !== 'Positive' || headers[2] !== 'Negative') {
      throw new Error('Unknown headers in CSV');
    }

    const date = process.env.SCRAPE_DATE ? process.env.SCRAPE_DATE : datetime.now.at('America/Halifax');
    let scrapeDate = datetime.getYYYYMMDD(date);

    // We're currently expecting this data back in YYYY-MM-DD
    const lastDateInTimeseries = data[data.length - 1].Date;
    const firstDateInTimeseries = data[0].Date;

    if (scrapeDate > lastDateInTimeseries) {
      console.error(
        `  🚨 timeseries for ${geography.getName(
          this
        )}: SCRAPE_DATE ${scrapeDate} is newer than last sample time ${lastDateInTimeseries}. Using last sample anyway`
      );
      scrapeDate = lastDateInTimeseries;
    }

    if (scrapeDate < firstDateInTimeseries) {
      throw new Error(`Timeseries starts later than SCRAPE_DATE ${scrapeDate}`);
    }

    for (const row of data) {
      if (row.Date === scrapeDate) {
        const pos = parse.number(row.Positive);
        const neg = parse.number(row.Negative);

        return {
          cases: pos,
          tested: pos + neg
        };
      }
    }
    throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${scrapeDate}`);
  }
};

export default scraper;
