import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Marin County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://coronavirus.marinhhs.org/surveillance',
  async scraper() {
    const $ = await fetch.page(this.url);
    const text = $('td:contains("confirmed cases of COVID-19")').text();
    const cases = parse.number(text.match(/there have been (\d+) confirmed cases of/)[1]);
    return { cases };
  }
};

export default scraper;
