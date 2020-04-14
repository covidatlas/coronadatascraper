import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Monterey County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  url:
    'https://www.co.monterey.ca.us/government/departments-a-h/administrative-office/office-of-emergency-services/response/covid-19',
  type: 'table',
  async scraper() {
    const $ = await fetch.page(this.url);
    let cases = 0;

    cases += parse.number(
      $('td:contains("Total")')
        .next()
        .text()
    );

    return { cases };
  }
};

export default scraper;
