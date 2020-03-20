import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'DEU',
  url: 'https://opendata.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0.csv',
  type: 'json',
  aggregate: 'county',
  sources: [
    {
      name: 'RKI county data',
      description: 'RKI county data as an arcgis dataset'
    }
  ],
  async scraper() {
    const data = await fetch.csv(this.url);
    const counties = [];
    for (const county of data) {
      counties.push({
        county: parse.string(county.GEN),
        state: parse.string(county.BL),
        cases: parse.number(county.cases),
        deaths: parse.number(county.deaths),
        population: parse.number(county.EWZ)
      });
    }
    return counties;
  }
};

export default scraper;
