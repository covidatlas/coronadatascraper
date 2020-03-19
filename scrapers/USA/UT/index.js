import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

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
  state: 'UT',
  country: 'USA',
  url: 'https://coronavirus.utah.gov/latest/',
  type: 'table',
  aggregate: 'county',
  async scraper() {
    const $ = await fetch.page(this.url);
    const counties = [];
    const $table = $('th:contains("District")').closest('table');
    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const county = parse.string($tr.find('td:first-child').text());
      const cases = parse.number($tr.find('td:last-child').text());
      if (index > 0 && county.indexOf('Non-Utah') === -1) {
        counties.push({
          county: transform.addCounty(county),
          cases
        });
      }
    });
    return counties;
  }
};

export default scraper;
