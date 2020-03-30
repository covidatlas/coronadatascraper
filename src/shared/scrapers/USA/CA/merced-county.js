import cheerioTableparser from 'cheerio-tableparser';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Merced County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.co.merced.ca.us/3350/Coronavirus-Disease-2019',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('h3:contains("Merced County COVID-19 Statistics")')
        .parent()
        .next('table');
      const cases = parse.number(
        $table
          .find('td:contains("Cases")')
          .next('td')
          .text()
      );
      const deaths = parse.number(
        $table
          .find('td:contains("Deaths")')
          .next('td')
          .text()
      );
      const recovered = parse.number(
        $table
          .find('td:contains("Recoveries")')
          .next('td')
          .text()
      );
      return {
        cases,
        deaths,
        recovered
      };
    },
    '2020-3-16': async function() {
      this.type = 'table';

      const $ = await fetch.page(this.url);
      cheerioTableparser($);

      const $table = $('td:contains("Cases")').closest('table');
      const data = $table.parsetable(false, false, true);
      if (
        !(
          data[0][0] === 'Total' &&
          data[1][0] === 'Count' &&
          data[0][1] === '*Tests' &&
          data[0][2] === 'Cases' &&
          data[0][3] === 'Deaths' &&
          data[0][4] === 'Recoveries'
        )
      ) {
        throw new Error('Unknown html table format/labels');
      }

      return {
        tested: parse.number(data[1][1]),
        cases: parse.number(data[1][2]),
        deaths: parse.number(data[1][3]),
        recoveries: parse.number(data[1][4])
      };
    }
  }
};

export default scraper;
