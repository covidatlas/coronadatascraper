import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Placer County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.placer.ca.gov/6448/Cases-in-Placer',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('p:contains("Confirmed COVID-19 Cases in Placer County")')
        .nextAll('table')
        .first();
      return {
        cases: parse.number(
          $table
            .find('td:contains("Positive Tests")')
            .closest('tr')
            .find('td:last-child')
            .text()
        ),
        deaths: parse.number(
          $table
            .find('td:contains("Deaths")')
            .closest('tr')
            .find('td:last-child')
            .text()
        )
      };
    },
    '3/28/2020': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      return {
        cases: parse.number(
          $('td:contains("Cases")')
            .next('td')
            .text()
        ),
        deaths: parse.number(
          $('td:contains("Deaths")')
            .next('td')
            .text()
        )
      };
    }
  }
};

export default scraper;
