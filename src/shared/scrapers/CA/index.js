import assert from 'assert';
import datetime from '../../lib/datetime/old/index.js';
import * as fetch from '../../lib/fetch/index.js';
import * as geography from '../../lib/geography/index.js';
import * as parse from '../../lib/parse.js';
import * as rules from '../../lib/rules.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const countryLevelMap = {
  Canada: 'iso1:CA',
  'British Columbia': 'iso2:CA-BC',
  'New Brunswick': 'iso2:CA-NB',
  'Newfoundland and Labrador': 'iso2:CA-NL',
  'Northwest Territories': 'iso2:CA-NT',
  'Nova Scotia': 'iso2:CA-NS',
  'Prince Edward Island': 'iso2:CA-PE',
  'Repatriated travellers': '-',
  Alberta: 'iso2:CA-AB',
  Manitoba: 'iso2:CA-MB',
  Nunavut: 'iso2:CA-NU',
  Ontario: 'iso2:CA-ON',
  Quebec: 'iso2:CA-QC',
  Saskatchewan: 'iso2:CA-SK',
  Yukon: 'iso2:CA-YT'
};

const scraper = {
  country: 'iso1:CA',
  sources: [
    {
      description: 'Health Promotion and Chronic Disease Prevention Branch',
      name: 'Public Health Agency of Canada',
      url: 'https://health-infobase.canada.ca/'
    }
  ],
  url: 'https://health-infobase.canada.ca/src/data/covidLive/covid19.csv',
  type: 'csv',
  _reject: [{ state: 'Repatriated travellers' }, { state: 'Total cases' }, { state: 'Total' }, { state: 'Canada' }],
  aggregate: 'state',
  scraper: {
    /*
    '0': async function() {
      this.url = 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html';
      const $ = await fetch.page(this.url);
      const $table = $('h2:contains("Current situation")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr');
      const regions = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          state: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:nth-child(2)').text())
        };
        if (rules.isAcceptable(data, null, this._reject)) {
          regions.push(data);
        }
      });
      regions.push(transform.sumData(regions));
      return regions;
    },
    */
    '0': async function() {
      const data = await fetch.csv(this.url, false);

      // FIXME when we roll out new TZ support!
      const fallback = process.env.USE_ISO_DATETIME ? new Date(datetime.now.at('America/Toronto')) : datetime.getDate();
      let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : fallback;
      let scrapeDateString = datetime.getDDMMYYYY(scrapeDate);
      const lastDateParts = data[data.length - 1].date.split('-');
      const lastDateInTimeseries = new Date(`${lastDateParts[2]}-${lastDateParts[1]}-${lastDateParts[0]} 12:00:00`);
      const firstDateParts = data[data.length - 1].date.split('-');
      const firstDateInTimeseries = new Date(`${firstDateParts[2]}-${firstDateParts[1]}-${firstDateParts[0]}12:00:00`);

      if (scrapeDate > lastDateInTimeseries) {
        console.error(
          `  🚨 timeseries for ${geography.getName(
            this
          )}: SCRAPE_DATE ${scrapeDateString} is newer than last sample time ${datetime.getYYYYMD(
            lastDateInTimeseries
          )}. Using last sample anyway`
        );
        scrapeDate = lastDateInTimeseries;
        scrapeDateString = datetime.getDDMMYYYY(scrapeDate);
      }

      if (scrapeDate < firstDateInTimeseries) {
        throw new Error(`Timeseries starts later than SCRAPE_DATE ${scrapeDateString}`);
      }

      const regions = [];
      for (const row of data) {
        if (row.date === scrapeDateString) {
          const state = parse.string(row.prname);
          const stateMapped = countryLevelMap[state];
          assert(stateMapped, `${state} not found in countryLevelMap`);

          if (stateMapped === '-') {
            continue;
          }

          const regionObj = {
            cases: parse.number(row.numconf),
            deaths: parse.number(row.numdeaths)
          };

          if (stateMapped === 'iso1:CA') {
            regionObj.country = stateMapped;
          } else {
            regionObj.state = stateMapped;
          }

          if (!rules.isAcceptable(regionObj, null, this._reject)) {
            continue;
          }

          regions.push(regionObj);
        }
      }

      if (regions.length === 0) {
        throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${scrapeDateString}`);
      }

      // no need to do this as they provide as the summary data
      // regions.push(transform.sumData(regions));

      return regions;
    }
  }
};

export default scraper;
