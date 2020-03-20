import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'CA',
  country: 'USA',
  priority: 1,
  type: 'csv',
  aggregate: 'county',
  url: 'https://docs.google.com/spreadsheets/d/1CwZA4RPNf_hUrwzNLyGGNHRlh1cwl8vDHwIoae51Hac/gviz/tq?tqx=out:csv&sheet=master',
  curators: [
    {
      name: 'Harriet Rowan',
      email: 'hattierowan@gmail.com',
      twitter: '@hattierowan',
      github: 'HarrietRowan'
    }
  ],
  async scraper() {
    const data = await fetch.csv(this.url);
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
  }
};

export default scraper;
