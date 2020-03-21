import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Stanislaus County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
  async scraper() {
    const $ = await fetch.page(this.url);
    return { cases: parse.number($('.counter').text()) };
  }
};

export default scraper;
