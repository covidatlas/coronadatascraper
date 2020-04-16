import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Solano County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'http://www.solanocounty.com/depts/ph/coronavirus.asp',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $el = $('*:contains("Number of Positive Cases")').first();
      const matches = $el.text().match(/Number of Positive Cases in Solano County: (\d+)/);
      return { cases: parse.number(matches[1]) };
    },
    '2020-03-23': async function() {
      const $ = await fetch.page(this.url);

      const lines = $('font:contains("Confirmed COVID-19")')
        .html()
        .split('<br>');
      const cases = parse.number(lines[1].split(':')[1]);
      const deaths = parse.number(lines[2].split(':')[1]);

      return { cases, deaths };
    },
    '2020-03-24': async function() {
      throw new DeprecatedError('Solano County, CA now uses a PDF');
    }
  }
};

export default scraper;
