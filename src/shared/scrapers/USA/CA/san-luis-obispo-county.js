import * as fetch from '../../../lib/fetch/index.js';
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

    let cases = $('td:contains("San Luis Obispo County")')
      .next()
      .text();

    if (cases === '') {
      throw new Error('Empty cases string');
    }

    cases = parse.number(cases);
    return { cases };
  }
};

export default scraper;
