import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Riverside County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.rivcoph.org/coronavirus',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $el = $('p:contains("Confirmed cases:")').first();
    const matches = $el.text().match(/Confirmed cases:.*?(\d+)/);
    return { cases: parse.number(matches[1]) };
  }
};

export default scraper;
