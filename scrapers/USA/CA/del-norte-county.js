import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Del Norte County',
  state: 'CA',
  country: 'USA',
  url: 'http://www.co.del-norte.ca.us/departments/health-human-services/public-health',
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
    '2020-3-18': async function() {
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
    }
  }
};

export default scraper;
