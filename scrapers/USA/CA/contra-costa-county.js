import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Contra Costa County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.coronavirus.cchealth.org/',
  maintainers: [maintainers.jbencina],
  async scraper() {
    const $ = await fetch.headless(this.url);
    const cases = parse.number(
      $('h1:contains("TOTAL")')
        .parent()
        .next()
        .text()
    );
    const deaths = parse.number(
      $('h1:contains("DEATHS")')
        .parent()
        .prev()
        .text()
    );
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
