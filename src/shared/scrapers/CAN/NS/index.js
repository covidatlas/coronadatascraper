import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as geography from '../../../lib/geography/index.js';
import * as datetime from '../../../lib/datetime.js';

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

    let scrapeDate = process.env.SCRAPE_DATE
      ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`)
      : new Date(`${datetime.getYYYYMD()} 12:00:00`);
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
  }
};

export default scraper;
