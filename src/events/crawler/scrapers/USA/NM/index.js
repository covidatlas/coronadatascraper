import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'NM',
  country: 'USA',
  url: 'https://cv.nmhealth.org/cases-by-county/',
  type: 'table',
  headless: false,
  aggregate: 'county',

  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    const $table = $('td:contains("County")').closest('table');
    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const cases = parse.number($tr.find('td:last-child').text());
      const county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));

      if (index < 1) {
        return;
      }

      counties.push({
        county,
        cases
      });
    });

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
