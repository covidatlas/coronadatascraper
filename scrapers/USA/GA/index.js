import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'GA',
  country: 'USA',
  url: 'https://dph.georgia.gov/covid-19-daily-status-report',
  type: 'table',
  async scraper() {
    const $ = await fetch.page(this.url);
    const counties = [];
    const $table = $('table:contains(County):contains(Cases)');
    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const county = transform.addCounty(parse.string($tr.find('td:first-child').text()));
      const cases = parse.number($tr.find('td:last-child').text());
      counties.push({county, cases});
    });

    return counties;
  }
};

export default scraper;
