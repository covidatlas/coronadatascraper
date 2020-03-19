import path from 'path';
import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import * as datetime from '../../lib/datetime.js';
import * as rules from '../../lib/rules.js';
import * as fs from '../../lib/fs.js';

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
  country: 'GBR',
  url: 'https://www.arcgis.com/sharing/rest/content/items/b684319181f94875a6879bbc833ca3a6/data',
  aggregate: 'county',
  type: 'csv',
  async scraper() {
    const data = await fetch.csv(this.url);
    const counties = [];
    for (const utla of data) {
      const name = parse.string(utla.GSS_NM);
      counties.push({
        county: name,
        cases: parse.number(utla.TotalCases)
      });
    }
    return counties;
  }
};

export default scraper;
