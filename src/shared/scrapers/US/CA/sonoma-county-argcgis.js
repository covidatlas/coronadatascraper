import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  url: 'https://opendata.arcgis.com/datasets/06fcfe6147574a75afea97a1f7565dc7_0.csv',
  aggregate: 'county',
  sources: [
    {
      name: 'Sonoma County Emergency and Preparedness Information',
      url: 'https://socoemergency.org/'
    }
  ],
  async scraper() {
    const data = await fetch.csv(this, this.url, 'default');
    const counties = [];
    for (const county of data) {
      counties.push({
        county: parse.string(geography.addCounty(county.COUNTY_NAME)),
        active: parse.number(county.Active),
        deaths: parse.number(county.Deaths),
        recovered: parse.number(county.Recovered),
        cases: parse.number(county.Cumulative)
      });
    }
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
