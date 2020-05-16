import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/old/index.js';

const csvParse = require('csv-parse/lib/sync');
const assert = require('assert');

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
      // The filename is COVID-19-data.csv, but it's not actually valid CSV ...
      // The first line appears to be obsolete headings, and the actual CSV starts on line 2.
      const rawdata = await fetch.raw(this, 'https://novascotia.ca/coronavirus/data/COVID-19-data.csv', 'default');
      const data = csvParse(rawdata, { columns: true, from_line: 2 });

      // The numbers in the data seem to match the totals shown on
      // https://novascotia.ca/coronavirus/data/, but they appear to
      // be handled differently.  In this data:
      // - Cases = _new_ cases for date
      // - Deaths = _new_ deaths for date
      // - Negative = total negative to date
      // - Recovered = recovered to date
      // - non-ICU + ICU = current hospitalized
      const expectedHeadings = ['Date', 'Cases', 'Negative', 'Recovered', 'non-ICU', 'ICU', 'Deaths'];
      const missingExpected = expectedHeadings.filter(h => {
        return !Object.keys(data[0]).includes(h);
      });
      assert.equal(missingExpected.length, 0, `Missing headings ${missingExpected.join()}`);

      // TODO (timezone) Have to interpret all date/times as 'America/Halifax' in Li
      const dt = new Date();
      const zeroPad = (num, places = 2) => String(num).padStart(places, '0');
      // en-US date = eg "12/19/2012"
      const [m, d, y] = dt
        .toLocaleDateString('en-US')
        .split('/')
        .map(n => zeroPad(n));
      const today = [y, m, d].join('-');

      let scrapeDate = process.env.SCRAPE_DATE || today;
      let scrapeDateString = datetime.getYYYYMMDD(scrapeDate);

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

      const dataToDate = data.filter(row => {
        return row.Date <= scrapeDate;
      });

      let totalCases = 0;
      let totalDeaths = 0;
      let result = {};
      for (const row of dataToDate) {
        totalCases += parse.number(row.Cases);
        totalDeaths += parse.number(row.Deaths);
        if (row.Date === scrapeDateString) {
          result = {
            cases: totalCases,
            tested: parse.number(row.Negative),
            recovered: parse.number(row.Recovered),
            deaths: totalDeaths
          };
        }
      }
      if (Object.keys(result).length > 0) {
        console.table(result);
        return result;
      }
      throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${scrapeDateString}`);
    }
  }
};

export default scraper;
