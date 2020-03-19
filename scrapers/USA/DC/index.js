import path from 'path';
import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as rules from '../../../lib/rules.js';
import * as fs from '../../../lib/fs.js';

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
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'DC',
  country: 'USA',
  url: 'https://coronavirus.dc.gov/page/coronavirus-data',
  type: 'paragraph',
  async scraper() {
    const $ = await fetch.page(this.url);
    if (datetime.scrapeDateIsBefore('2020-3-17')) {
      let cases = 0;
      cases += parse.number(
        $('p:contains("Number of PHL positives")')
          .first()
          .text()
          .split(': ')[1]
      );
      cases += parse.number(
        $('p:contains("Number of commercial lab positives")')
          .first()
          .text()
          .split(': ')[1]
      );
      return {
        cases,
        tested: parse.number(
          $('p:contains("Number of people tested overall")')
            .first()
            .text()
            .split(': ')[1]
        )
      };
    }
    let cases = 0;
    cases += parse.number(
      $('li:contains("Number of PHL positives")')
        .first()
        .text()
        .split(': ')[1]
    );
    cases += parse.number(
      $('li:contains("Number of commercial lab positives")')
        .first()
        .text()
        .split(': ')[1]
    );
    return {
      cases,
      tested: parse.number(
        $('li:contains("Number of people tested overall")')
          .first()
          .text()
          .split(': ')[1]
      )
    };
  }
};

export default scraper;
