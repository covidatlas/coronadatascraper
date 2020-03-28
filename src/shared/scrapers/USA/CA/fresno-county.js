import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Fresno County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.co.fresno.ca.us/departments/public-health/covid-19',
  maintainers: [maintainers.jbencina],
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      return {
        cases: parse.number($('li:contains("Total cases")').text()),
        deaths: parse.number($('li:contains("Total deaths")').text())
      };
    },
    '2020-3-27': async function() {
      const $ = await fetch.page(this.url);
      return {
        cases: parse.number(
          $('li:contains("Total cases")')
            .contents()
            .filter(function() {
              return this.nodeType === 3;
            })
            .text()
        ),
        deaths: parse.number($('li:contains("Total deaths")').text())
      };
    }
  }
};

export default scraper;
