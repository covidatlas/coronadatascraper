import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Orange County',
  state: 'CA',
  country: 'USA',
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
    '2020-3-18': async function scraper() {
      this.url = 'https://occovid19.ochealthinfo.com/coronavirus-in-oc';
      await fetch.page(this.url);
      throw new Error('Need to scrape new page');
    }
  }
};

export default scraper;
