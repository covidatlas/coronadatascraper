import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Mendocino County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
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
    '2020-03-18': async function() {
      const $ = await fetch.page(this.url);
      const $strong = $('strong:contains("current case")');
      const cases = parse.number($strong.text().match(/(\d+) current/)[1]);
      return { cases };
    },
    '2020-03-23': async function() {
      const $ = await fetch.page(this.url);
      const $outerLI = $('li:contains("Testing Numbers")');
      const $li = $outerLI.find('li:contains("Total Positives")');
      const cases = parse.number($li.text().split(':')[1]);
      return { cases };
    },
    '2020-04-15': async function() {
      await fetch.page(this.url);
      throw new DeprecatedError('Sunsetting county level scrapers');
    }
  }
};

export default scraper;
