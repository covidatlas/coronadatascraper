import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Benito County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://hhsa.cosb.us/publichealth/communicable-disease/coronavirus/',
  scraper: {
    '0': async function scraper() {
      const $ = await fetch.page(this.url);
      const $table = $('h1:contains("San Benito County COVID-19 Case Count")')
        .nextAll('table')
        .first();
      return {
        cases: parse.number(
          $table
            .find('td:contains("Positive")')
            .next('td')
            .text()
        ),
        deaths: parse.number(
          $table
            .find('td:contains("Deaths")')
            .next('td')
            .text()
        ),
        recovered: parse.number(
          $table
            .find('td:contains("Recovered")')
            .next('td')
            .text()
        )
      };
    },
    '2020-03-19': async function scraper() {
      throw new DeprecatedError('Need to scrape new arcgis');
    }
  }
};

export default scraper;
