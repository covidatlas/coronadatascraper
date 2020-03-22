import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'IL',
  country: 'USA',
  priority: 1,
  url: 'http://www.dph.illinois.gov/sites/default/files/COVID19/COVID19CountyResults.json',
  async scraper() {
    const data = await fetch.json(this.url);
    const counties = [];
    for (const county of data.characteristics_by_county.values) {
      counties.push({
        county: geography.addCounty(county.County),
        cases: parse.number(county.confirmed_cases),
        tested: parse.number(county.total_tested)
      });
    }
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
