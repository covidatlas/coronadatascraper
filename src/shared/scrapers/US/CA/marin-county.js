import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Marin County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://coronavirus.marinhhs.org/surveillance',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const text = $('td:contains("confirmed cases of COVID-19")').text();
      const cases = parse.number(text.match(/there have been (\d+) confirmed cases of/)[1]);
      return { cases };
    },
    '2020-04-15': async function() {
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError('Sunsetting county level scrapers');
    }
  }
};

export default scraper;
