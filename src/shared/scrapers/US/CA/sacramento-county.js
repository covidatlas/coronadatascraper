import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Sacramento County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.saccounty.net/COVID-19/Pages/default.aspx',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('th:contains("Confirmed")').closest('table');
      const $tds = $table.find('tr:nth-child(2) > td');
      return {
        cases: parse.number($tds.first().text()),
        deaths: parse.number($tds.last().text())
      };
    },
    '2020-04-15': async function() {
      await fetch.page(this.url);
      throw new DeprecatedError('Sunsetting county scraper');
    }
  }
};

export default scraper;
