import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-CA',
  country: 'iso1:US',
  priority: 1,
  type: 'csv',
  url:
    'https://docs.google.com/spreadsheets/d/1CwZA4RPNf_hUrwzNLyGGNHRlh1cwl8vDHwIoae51Hac/gviz/tq?tqx=out:csv&sheet=timeseries',
  aggregate: 'county',
  timeseries: true,
  curators: [
    {
      name: 'The Mercury News',
      email: 'hattierowan@gmail.com',
      twitter: '@hattierowan',
      github: 'HarrietRowan'
    }
  ],
  _processData(data) {
    let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : new Date();
    let scrapeDateString = datetime.getYYYYMMDD(scrapeDate);

    const lastDateInTimeseries = new Date(`${data[0].Date} 12:00:00`);
    const firstDateInTimeseries = new Date(`${data[data.length - 1].Date} 12:00:00`);

    if (scrapeDate > lastDateInTimeseries) {
      console.error(
        `  🚨 timeseries for Mercury News (CA): SCRAPE_DATE ${datetime.getYYYYMD(
          scrapeDate
        )} is newer than last sample time ${datetime.getYYYYMD(lastDateInTimeseries)}. Using last sample anyway`
      );
      scrapeDate = lastDateInTimeseries;
      scrapeDateString = datetime.getYYYYMMDD(scrapeDate);
    }

    if (scrapeDate < firstDateInTimeseries) {
      throw new Error(
        `Timeseries starts at ${datetime.getYYYYMD(firstDateInTimeseries)}, but SCRAPE_DATE is ${datetime.getYYYYMD(
          scrapeDate
        )}`
      );
    }

    const counties = [];
    for (const stateData of data) {
      if (stateData.Date === scrapeDateString) {
        const stateObj = { county: geography.addCounty(stateData.County) };
        if (stateData['Cases Total'] !== '') {
          stateObj.cases = parse.number(stateData['Cases Total']);
        }
        if (stateData['Tests Total'] !== '') {
          stateObj.tested = parse.number(stateData['Tests Total']);
        }
        if (stateData['Recovered Total'] !== '') {
          stateObj.recovered = parse.number(stateData['Recovered Total']);
        }
        if (stateData['Deaths Total'] !== '') {
          stateObj.deaths = parse.number(stateData['Deaths Total']);
        }
        if (stateData['Hospital Confirmed Total'] !== '') {
          stateObj.hospitalized = parse.number(stateData['Hospital Confirmed Total']);
        }
        if (stateData['Hospital Confirmed Current'] !== '') {
          stateObj.hospitalized_current = parse.number(stateData['Hospital Confirmed Current']);
        }
        if (stateData['ICU Total'] !== '') {
          stateObj.icu = parse.number(stateData['ICU Total']);
        }
        if (stateData['ICU Current'] !== '') {
          stateObj.icu_current = parse.number(stateData['ICU Current']);
        }
        counties.push(stateObj);
      }
    }

    if (counties.length === 0) {
      throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${datetime.getYYYYMD(scrapeDate)}`);
    }

    counties.push(transform.sumData(counties));
    return counties;
  },
  async scraper() {
    const data = await fetch.csv(this, this.url, 'default', false);
    return this._processData(data);
  }
};

export default scraper;
