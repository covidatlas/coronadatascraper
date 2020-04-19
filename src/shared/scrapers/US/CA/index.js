import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-CA',
  country: 'iso1:US',
  priority: 1,
  type: 'csv',
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
    const counties = [];
    for (const stateData of data) {
      const stateObj = { county: geography.addCounty(stateData.county) };
      if (stateData.cases !== '') {
        stateObj.cases = parse.number(stateData.cases);
      }
      if (stateData.tested !== '') {
        stateObj.tested = parse.number(stateData.tested);
      }
      if (stateData.recovered !== '') {
        stateObj.recovered = parse.number(stateData.recovered);
      }
      if (stateData.deaths !== '') {
        stateObj.deaths = parse.number(stateData.deaths);
      }
      counties.push(stateObj);
    }
    counties.push(transform.sumData(counties));
    return counties;
  },
  async _fetchLatest() {
    this.url =
      'https://docs.google.com/spreadsheets/d/1CwZA4RPNf_hUrwzNLyGGNHRlh1cwl8vDHwIoae51Hac/gviz/tq?tqx=out:csv&sheet=master';
    const data = await fetch.csv(this, this.url, 'default');
    return this._processData(data);
  },
  scraper: {
    '0': async function() {
      return this._fetchLatest();
    },
    '2020-04-06': async function() {
      this.url =
        'https://docs.google.com/spreadsheets/d/1CwZA4RPNf_hUrwzNLyGGNHRlh1cwl8vDHwIoae51Hac/gviz/tq?tqx=out:csv&sheet=2020-04-06';
      const data = await fetch.csv(this, this.url, 'default', false);
      return this._processData(data);
    },
    '2020-04-07': async function() {
      return this._fetchLatest();
    }
  }
};

export default scraper;
