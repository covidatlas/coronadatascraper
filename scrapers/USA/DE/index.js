import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'DE',
  country: 'USA',
  aggregate: 'county',
  async scraper() {
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      this.url = 'https://www.dhss.delaware.gov/dhss/dph/epi/2019novelcoronavirus.html';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const $td = $('*:contains("County breakdown")')
        .closest('tr')
        .find('td:last-child');
      const counties = $td
        .html()
        .split('<br>')
        .map(str => {
          const parts = str.split(': ');
          return {
            county: geography.addCounty(parse.string(parts[0])),
            cases: parse.number(parts[1])
          };
        });
      counties.push(transform.sumData(counties));
      return counties;
    }
    this.url = 'http://opendata.arcgis.com/datasets/c8d4efa2a6bd48a1a7ae074a8166c6fa_0.csv';
    this.type = 'csv';
    const data = await fetch.csv(this.url);
    const counties = [];
    for (const county of data) {
      counties.push({
        county: geography.addCounty(parse.string(county.NAME)),
        cases: parse.number(county.Presumptive_Positive),
        recovered: parse.number(county.Recovered)
      });
    }
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
