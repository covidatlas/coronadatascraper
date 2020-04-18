import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Riverside County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.rivcoph.org/coronavirus',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $el = $('p:contains("Confirmed cases:")').first();
      const matches = $el.text().match(/Confirmed cases:.*?(\d+)/);
      return { cases: parse.number(matches[1]) };
    },
    '2020-04-15': async function() {
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError('Sunsetting county scraper');
    }
  }
};

export default scraper;
