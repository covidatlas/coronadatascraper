import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { NotImplementedError } from '../../../lib/errors.js';

const assert = require('assert');

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Orange County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'http://www.ochealthinfo.com/phs/about/epidasmt/epi/dip/prevention/novel_coronavirus',
  _getHeadingValue($, heading) {
    // console.log($('h2'));
    const h2s = $('h2').toArray();
    const h2 = h2s.find(h =>
      $(h)
        .text()
        .trim()
        .includes(heading)
    );
    assert(h2, `Found h2 with text ${heading}`);
    const cell = $(h2)
      .parent()
      .parent()
      .find('div.panel-body > h1');
    const txt = cell.text();
    assert(txt !== '', 'Have non-empty cell');
    return parse.number(txt);
  },
  scraper: {
    '0': async function scraper() {
      const $ = await fetch.page(this, this.url, 'default');
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
      // TODO: even though we have this url, the cache is missing until -3-28
      // sha = 517447c21046ee6b261911b1d5e320d6
      // no cache present coronadatascraper-cache/2020-3-27/{sha}.html
      // Cache hit ... coronadatascraper-cache/2020-3-28/{sha}.html
      this.url = 'https://occovid19.ochealthinfo.com/coronavirus-in-oc';
      await fetch.page(this, this.url, 'default');
      throw new NotImplementedError('Need to scrape new page');
    },
    '2020-03-28': async function scraper() {
      this.url = 'https://occovid19.ochealthinfo.com/coronavirus-in-oc';
      const $ = await fetch.page(this, this.url, 'default');
      return {
        cases: this._getHeadingValue($, 'Cumulative Cases to Date'),
        deaths: this._getHeadingValue($, 'Cumulative Deaths to Date')
      };
    },
    // Tests added on this date.
    '2020-04-24': async function scraper() {
      this.url = 'https://occovid19.ochealthinfo.com/coronavirus-in-oc';
      const $ = await fetch.page(this, this.url, 'default');
      return {
        cases: this._getHeadingValue($, 'Cumulative Cases to Date'),
        deaths: this._getHeadingValue($, 'Cumulative Deaths to Date'),
        tested: this._getHeadingValue($, 'Cumulative Tests To Date')
      };
    }
  }
};

export default scraper;
