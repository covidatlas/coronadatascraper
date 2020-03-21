import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'USA',
  state: 'IN',
  priority: 1,
  url: 'https://opendata.arcgis.com/datasets/d14de7e28b0448ab82eb36d6f25b1ea1_0.csv',
  aggregate: 'county',
  _countyMap: {
    'Verm.': 'Vermillion',
    'Vander.': 'Vanderburgh',
    'St Joseph': 'St. Joseph'
  },
  async scraper() {
    const data = await fetch.csv(this.url);
    const counties = [];
    for (const county of data) {
      let countyName = parse.string(county.COUNTYNAME);
      countyName = this._countyMap[countyName] || countyName;
      counties.push({
        county: geography.addCounty(countyName),
        cases: parse.number(county.Total_Positive),
        deaths: parse.number(county.Total_Deaths),
        tested: parse.number(county.Total_Tested)
      });
    }
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
