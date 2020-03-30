import cheerioTableparser from 'cheerio-tableparser';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Barbara County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://publichealthsbc.org',
  type: 'paragraph',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      let cases = 0;

      cases += parse.number(
        $('div.elementor-counter-title:contains("SANTA BARBARA COUNTY")')
          .prev()
          .find('span.elementor-counter-number')
          .text()
      );

      return { cases };
    },
    '2020-3-26': async function() {
      this.type = 'table';

      const $ = await fetch.page(this.url);
      cheerioTableparser($);

      let $table = $('td:contains("City or Area")').closest('table');
      let data = $table.parsetable(false, false, true);
      if (data[1][0].indexOf('Confirmed Cases') === -1) {
        throw new Error('Unknown headers in html table');
      }
      let lastRow = data[0].length - 1;
      if (data[0][lastRow] !== 'Total') {
        throw new Error('Unknown html table format');
      }
      const cases = parse.number(data[1][lastRow]);

      $table = $('td:contains("Testing Status")').closest('table');
      data = $table.parsetable(false, false, true);
      if (data[1][0].indexOf('Total') === -1) {
        throw new Error('Unknown headers in html table');
      }
      lastRow = data[0].length - 1;
      if (data[0][lastRow] !== 'Total Tests') {
        throw new Error('Unknown html table format');
      }
      const tested = parse.number(data[1][lastRow]);

      return { cases, tested };
    }
  }
};

export default scraper;
