import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  url: 'https://opendata.arcgis.com/datasets/969678bce431494a8f64d7faade6e5b8_0.csv',
  country: 'USA',
  state: 'NC',
  aggregate: 'county',
  async scraper() {
    const data = await fetch.csv(this.url);
    const counties = [];
    for (const county of data) {
      counties.push({
        county: geography.addCounty(parse.string(county.County)),
        cases: parse.number(county.Total),
        deaths: parse.number(county.Deaths)
      });
    }
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
