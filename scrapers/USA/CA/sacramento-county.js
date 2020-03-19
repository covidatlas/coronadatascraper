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
  county: 'Sacramento County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.saccounty.net/COVID-19/Pages/default.aspx',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('th:contains("Confirmed")').closest('table');
    const $tds = $table.find('tr:last-child > td');
    return {
      cases: parse.number($tds.first().text()),
      deaths: parse.number($tds.last().text())
    };
  }
};

export default scraper;
