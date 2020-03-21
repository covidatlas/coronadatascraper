import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Mendocino County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.mendocinocounty.org/community/novel-coronavirus',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const cases = parse.number(
        $('strong:contains("current cases of COVID-19")')
          .text()
          .match(/There are (\d+) current cases of/)[1]
      );
      return { cases };
    },
    '2020-3-18': async function() {
      const $ = await fetch.page(this.url);
      const $strong = $('strong:contains("current case")');
      const cases = parse.number($strong.text().match(/(\d+) current/)[1]);
      return { cases };
    }
  }
};

export default scraper;
