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
  county: 'San Benito County',
  state: 'CA',
  country: 'USA',
  url: 'https://hhsa.cosb.us/publichealth/communicable-disease/coronavirus/',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('h1:contains("San Benito County COVID-19 Case Count")')
      .nextAll('table')
      .first();
    return {
      cases: parse.number(
        $table
          .find('td:contains("Positive")')
          .next('td')
          .text()
      ),
      deaths: parse.number(
        $table
          .find('td:contains("Deaths")')
          .next('td')
          .text()
      ),
      recovered: parse.number(
        $table
          .find('td:contains("Recovered")')
          .next('td')
          .text()
      )
    };
  }
};

export default scraper;
