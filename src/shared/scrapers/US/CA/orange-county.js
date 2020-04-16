import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Orange County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'http://www.ochealthinfo.com/phs/about/epidasmt/epi/dip/prevention/novel_coronavirus',
  scraper: {
    '0': async function scraper() {
      const $ = await fetch.page(this.url);
      return {
        cases: parse.number(
          $('td:contains("Cases")')
            .next()
            .text()
        ),
        deaths: parse.number(
          $('td:contains("Total Deaths")')
            .next()
            .text()
        )
      };
    },
    '2020-03-18': async function scraper() {
      this.url = 'https://occovid19.ochealthinfo.com/coronavirus-in-oc';
      await fetch.page(this.url);
      throw new DeprecatedError('Need to scrape new page');
    }
  }
};

export default scraper;
