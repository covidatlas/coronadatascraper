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
  curators: [
    {
      name: 'The Mercury News',
      email: 'hattierowan@gmail.com',
      twitter: '@hattierowan',
      github: 'HarrietRowan'
    }
  ],
  _processData(data) {
    const scrapeDateString = datetime.getYYYYMMDD(
      process.env.SCRAPE_DATE && new Date(`${process.env.SCRAPE_DATE} 12:00:00`)
    );
    console.log(scrapeDateString);
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
        counties.push(stateObj);
      }
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
