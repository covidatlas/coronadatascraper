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
  county: 'Merced County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.co.merced.ca.us/3350/Coronavirus-Disease-2019',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('h3:contains("Merced County COVID-19 Statistics")')
      .parent()
      .next('table');
    const cases = parse.number(
      $table
        .find('td:contains("Cases")')
        .next('td')
        .text()
    );
    const deaths = parse.number(
      $table
        .find('td:contains("Deaths")')
        .next('td')
        .text()
    );
    const recovered = parse.number(
      $table
        .find('td:contains("Recoveries")')
        .next('td')
        .text()
    );
    return {
      cases,
      deaths,
      recovered
    };
  }
};

export default scraper;
