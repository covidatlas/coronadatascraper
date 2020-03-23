import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'GBR',
  state: 'England',
  url: 'https://www.arcgis.com/sharing/rest/content/items/b684319181f94875a6879bbc833ca3a6/data',
  aggregate: 'county',
  type: 'csv',
  async scraper() {
    const data = await fetch.csv(this.url);
    const counties = [];
    for (const utla of data) {
      const name = parse.string(utla.GSS_NM);
      counties.push({
        county: name,
        cases: parse.number(utla.TotalCases)
      });
    }
    return counties;
  }
};

export default scraper;
