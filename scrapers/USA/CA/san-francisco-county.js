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
  county: 'San Francisco County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.sfdph.org/dph/alerts/coronavirus.asp',
  type: 'paragraph',
  async scraper() {
    let deaths;
    let cases;
    const $ = await fetch.page(this.url);
    const $h2 = $('h2:contains("Cases in San Francisco")');
    {
      const $p = $h2.nextAll('*:contains("Cases:")');
      cases = parse.number($p.text());
    }
    {
      const $p = $h2.nextAll('*:contains("Deaths:")');
      deaths = parse.number($p.text());
    }
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
