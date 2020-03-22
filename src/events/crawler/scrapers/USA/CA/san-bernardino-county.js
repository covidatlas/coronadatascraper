import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Bernardino County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'http://wp.sbcounty.gov/dph/coronavirus/',
  async scraper() {
    const $ = await fetch.page(this.url);
    const cases = parse.number(
      $('h3:contains("COVID-19 CASES")')
        .parent()
        .attr('data-number-value')
    );
    return { cases };
  }
};

export default scraper;
