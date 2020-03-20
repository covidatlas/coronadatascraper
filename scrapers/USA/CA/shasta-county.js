import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Shasta County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.co.shasta.ca.us/index/hhsa/health-safety/current-heath-concerns/coronavirus',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $el = $('h3:contains("Positive cases:")').first();
    const matches = $el.text().match(/Positive cases:.*?(\d+)/);
    return { cases: parse.number(matches[1]) };
  }
};

export default scraper;
