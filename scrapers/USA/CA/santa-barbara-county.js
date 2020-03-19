import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Barbara County',
  state: 'CA',
  country: 'USA',
  url: 'https://publichealthsbc.org',
  type: 'paragraph',
  async scraper() {
    const $ = await fetch.headless(this.url);
    let cases = 0;
    const tested = 0;

    cases += parse.number(
      $('div.elementor-counter-title:contains("SANTA BARBARA COUNTY")')
        .prev()
        .find('span.elementor-counter-number')
        .text()
    );

    return {
      cases,
      tested
    };
  }
};

export default scraper;
