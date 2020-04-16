import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Del Norte County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  url: 'http://www.co.del-norte.ca.us/departments/health-human-services/public-health',
  maintainers: [maintainers.jbencina],
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const cases = parse.number(
        $('font:contains("Number of Confirmed Cases")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );
      const pui = parse.number(
        $('font:contains("Number of Persons Under Investigation")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );
      const pending = parse.number(
        $('font:contains("Number of Specimens with Results Pending")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );
      const negative = parse.number(
        $('font:contains("Number of Negative Tests")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );
      const tested = pui + pending + negative;
      return {
        cases,
        tested
      };
    },
    '2020-03-18': async function() {
      const $ = await fetch.page(this.url);
      const cases = parse.number(
        $('font:contains("Number of Positive")')
          .first()
          .text()
          .match(/(\d+)$/)[1]
      );
      const tested = parse.number(
        $('font:contains("Number of Tests Administered")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );
      return {
        cases,
        tested
      };
    },
    '2020-04-15': async function() {
      await fetch.page(this.url);
      throw new DeprecatedError('Sunsetting county level scraper');
    }
  }
};

export default scraper;
