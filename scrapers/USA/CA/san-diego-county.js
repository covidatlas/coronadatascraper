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
  county: 'San Diego County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
  async scraper() {
    const $ = await fetch.page(this.url);
    let cases = 0;
    $('td:contains("Positive (confirmed cases)")')
      .nextAll('td')
      .each((index, td) => {
        cases += parse.number($(td).text());
      });
    $('td:contains("Presumptive Positive")')
      .nextAll('td')
      .each((index, td) => {
        cases += parse.number($(td).text());
      });
    return {
      cases,
      tested: parse.number(
        $('td:contains("Total Tested")')
          .next('td')
          .text()
      )
    };
  }
};

export default scraper;
