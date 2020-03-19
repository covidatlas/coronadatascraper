import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';

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
  state: 'TX',
  country: 'USA',
  url: 'https://www.dshs.state.tx.us/news/updates.shtm',
  type: 'table',
  aggregate: 'county',
  ssl: false,
  certValidation: false,
  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    let $table;
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      $table = $('table[summary="Texas COVID-19 Cases"]');
    } else {
      $table = $('table[summary="COVID-19 Cases in Texas Counties"]');
    }
    const $trs = $table.find('tbody > tr:not(:last-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const county = transform.addCounty(
        $tr
          .find('td:first-child')
          .text()
          .replace(/[\d]*/g, '')
      );
      const cases = parse.number($tr.find('td:last-child').text());
      counties.push({
        county,
        cases
      });
    });
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
