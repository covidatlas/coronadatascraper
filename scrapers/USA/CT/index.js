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
  state: 'CT',
  country: 'USA',
  url: 'https://portal.ct.gov/Coronavirus',
  type: 'list',
  aggregate: 'county',
  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    const $lis = $('span:contains("Latest COVID-19 Testing Data in Connecticut")')
      .nextAll('ul')
      .first()
      .find('li');
    $lis.each((index, li) => {
      if (index < 1) {
        return;
      }
      const countyData = $(li)
        .text()
        .split(/:\s*/);
      counties.push({
        county: parse.string(countyData[0]),
        cases: parse.number(countyData[1])
      });
    });
    return counties;
  }
};

export default scraper;
