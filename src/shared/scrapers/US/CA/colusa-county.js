import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

const assert = require('assert');

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Colusa County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  url: 'http://www.countyofcolusa.org/99/Public-Health',
  maintainers: [maintainers.jbencina],
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const cases = parse.number(
        $('strong:contains("Confirmed Cases:")')
          .first()
          .text()
          .match(/Confirmed Cases: (\d+)/)[1]
      );
      return { cases };
    },
    '2020-05-03': async function() {
      this.url = 'http://www.countyofcolusa.org/covid19';
      const $ = await fetch.page(this, this.url, 'default');
      const el = $('p:contains("Confirmed Cases:")');
      assert.equal(el.length, 1, 'Have 1 <p> containing Confirmed Cases');
      const cases = parse.number(el.eq(0).text());
      return { cases };
    }
  }
};

export default scraper;
