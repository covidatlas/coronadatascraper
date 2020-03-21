import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Butte County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.buttecounty.net/publichealth',
  maintainers: [maintainers.jbencina],
  async scraper() {
    const $ = await fetch.page(this.url);
    const cases = parse.number(
      $('td:contains("Positive COVID-19 Tests")')
        .next()
        .text()
    );
    return { cases };
  }
};

export default scraper;
