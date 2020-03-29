import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Madera County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.maderacounty.com/government/public-health/health-updates/corona-virus',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $el = $('*:contains("Confirmed cases")').first();
    const matches = $el.text().match(/Confirmed cases:.*?(\d+)/);
    return { cases: parse.number(matches[1]) };
  }
};

export default scraper;
