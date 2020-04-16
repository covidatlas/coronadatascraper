import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Madera County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.maderacounty.com/government/public-health/health-updates/corona-virus',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $el = $('*:contains("Confirmed cases")').first();
      const matches = $el.text().match(/Confirmed cases:.*?(\d+)/);
      return { cases: parse.number(matches[1]) };
    },
    '2020-04-04': async function() {
      throw new DeprecatedError('Madera County, CA now uses a PNG');
    }
  }
};

export default scraper;
