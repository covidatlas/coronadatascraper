import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Yolo County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url:
    'https://www.yolocounty.org/health-human-services/adults/communicable-disease-investigation-and-control/novel-coronavirus-2019',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      if (datetime.scrapeDateIsBefore('2020-03-17')) {
        const $h3 = $('h3:contains("confirmed case")');
        const matches = $h3.text().match(/there are (\d+) confirmed cases? in Yolo/);
        return { cases: parse.number(matches[1]) };
      }
      const $h3 = $('h3:contains("confirmed case")');
      const matches = $h3.text().match(/(\d+) confirmed case/);
      return { cases: parse.number(matches[1]) };
    },
    '2020-04-15': async function() {
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError('Sunsetting county scraper');
    }
  }
};

export default scraper;
