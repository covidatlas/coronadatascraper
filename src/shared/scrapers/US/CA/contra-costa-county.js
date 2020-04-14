import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Contra Costa County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
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
