import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as rules from '../../lib/rules.js';

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
  country: 'Canada',
  url: 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html',
  type: 'table',
  _reject: [{ state: 'Repatriated travellers' }, { state: 'Total cases' }],
  aggregate: 'state',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('h2:contains("Current situation")')
      .nextAll('table')
      .first();
    const $trs = $table.find('tbody > tr');
    const regions = [];
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const data = {
        state: parse.string($tr.find('td:first-child').text()),
        cases: parse.number($tr.find('td:nth-child(2)').text())
      };
      if (rules.isAcceptable(data, null, this._reject)) {
        regions.push(data);
      }
    });
    return regions;
  }
};

export default scraper;
