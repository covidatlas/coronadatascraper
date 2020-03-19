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
  country: 'USA',
  url: 'https://www.cdc.gov/coronavirus/2019-ncov/map-data-cases.csv',
  _getCaseNumber(string) {
    if (typeof string === 'string') {
      const matches = string.match(/(\d+) of (\d+)/);
      if (string === 'None') {
        return 0;
      }
      if (matches) {
        return parse.number(matches[2]);
      }
      return parse.number(string);
    }
    return string;
  },
  async _scraper() {
    const data = await fetch.csv(this.url);
    const states = [];
    for (const stateData of data) {
      if (stateData.Name) {
        states.push({
          state: transform.toUSStateAbbreviation(parse.string(stateData.Name)),
          cases: this._getCaseNumber(stateData['Cases Reported'])
        });
      }
    }
    return states;
  }
};

export default scraper;
