import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'TN',
  country: 'USA',
  url: 'https://www.tn.gov/health/cedep/ncov.html',
  type: 'table',
  aggregate: 'county',
  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    const $table = $('th:contains("Case Count")').closest('table');
    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      if (index < 1) {
        return;
      }
      const $tr = $(tr);
      counties.push({
        county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
        cases: parse.number($tr.find('td:last-child').text())
      });
    });
    return counties;
  }
};

export default scraper;
