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
  county: 'Sonoma County',
  state: 'CA',
  country: 'USA',
  url: 'https://socoemergency.org/emergency/novel-coronavirus/novel-coronavirus-in-sonoma-county/',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $th = $('th:contains("Total in Sonoma County")');
    const $table = $th.closest('table');
    const $td = $table.find('td:last-child');
    const cases = parse.number($td.text());
    return { cases };
  }
};

export default scraper;
