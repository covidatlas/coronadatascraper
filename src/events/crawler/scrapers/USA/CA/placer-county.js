import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Placer County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.placer.ca.gov/6448/Cases-in-Placer',
  async scraper() {
    const $ = await fetch.page(this.url);
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
  }
};

export default scraper;
