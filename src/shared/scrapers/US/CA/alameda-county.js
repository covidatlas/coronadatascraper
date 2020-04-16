import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Alameda County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  sources: [
    {
      url: 'http://www.acphd.org',
      name: 'Alameda County Public Health Department'
    }
  ],
  url: 'http://www.acphd.org/2019-ncov.aspx',
  headless: true,
  type: 'paragraph',
  maintainers: [maintainers.jbencina],
  scraper: {
    '0': async function() {
      const $ = await fetch.headless(this.url);
      const $el = $('p:contains("Positive Cases")');
      const matches = $el.html().match(/Positive Cases:.*?(\d+).*/);
      return { cases: parse.number(matches[1]) };
    },
    '2020-04-15': async function() {
      await fetch.headless(this.url);
      throw new DeprecatedError('Sunsetting county level scrapers');
    }
  }
};

export default scraper;
