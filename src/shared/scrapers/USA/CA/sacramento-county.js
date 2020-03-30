import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Sacramento County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.saccounty.net/COVID-19/Pages/default.aspx',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('th:contains("Confirmed")').closest('table');
    const $tds = $table.find('tr:nth-child(2) > td');
    return {
      cases: parse.number($tds.first().text()),
      deaths: parse.number($tds.last().text())
    };
  }
};

export default scraper;
