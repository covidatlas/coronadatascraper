import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Calaveras County',
  state: 'CA',
  country: 'USA',
  url: 'https://covid19.calaverasgov.us/',
  maintainers: [maintainers.jbencina],
  async scraper() {
    const $ = await fetch.page(this.url);
    const cases = parse.number(
      $('h2:contains("in Calaveras County:")')
        .first()
        .text()
        .match(/in Calaveras County: (\d+)/)[1]
    );
    return { cases };
  }
};

export default scraper;
