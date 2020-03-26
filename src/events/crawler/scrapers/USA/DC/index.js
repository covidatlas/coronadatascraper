import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'DC',
  country: 'USA',
  url: 'https://coronavirus.dc.gov/page/coronavirus-data',
  type: 'paragraph',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);

      let cases = 0;
      cases += parse.number(
        $('p:contains("Number of PHL positives")')
          .first()
          .text()
          .split(': ')[1]
      );
      cases += parse.number(
        $('p:contains("Number of commercial lab positives")')
          .first()
          .text()
          .split(': ')[1]
      );
      return {
        cases,
        tested: parse.number(
          $('p:contains("Number of people tested overall")')
            .first()
            .text()
            .split(': ')[1]
        )
      };
    },
    '2020-03-17': async function() {
      const $ = await fetch.page(this.url);

      let cases = 0;
      cases += parse.number(
        $('li:contains("Number of PHL positives")')
          .first()
          .text()
          .split(': ')[1]
      );
      cases += parse.number(
        $('li:contains("Number of commercial lab positives")')
          .first()
          .text()
          .split(': ')[1]
      );
      return {
        cases,
        tested: parse.number(
          $('li:contains("Number of people tested overall")')
            .first()
            .text()
            .split(': ')[1] || ''
        )
      };
    }
  }
};

export default scraper;
