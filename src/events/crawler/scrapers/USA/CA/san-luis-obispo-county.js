import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Luis Obispo County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.emergencyslo.org/en/covid19.aspx',
  type: 'paragraph',
  async scraper() {
    const $ = await fetch.page(this.url);
    let cases = 0;

    cases += parse.number(
      $('tr.titlerow')
        .find('td:contains("San Luis Obispo County")')
        .next()
        .text()
    );

    return { cases };
  }
};

export default scraper;
