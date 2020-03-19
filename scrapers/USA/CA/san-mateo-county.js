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
  county: 'San Mateo County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.smchealth.org/coronavirus',
  async scraper() {
    let deaths;
    let cases;
    const $ = await fetch.page(this.url);
    const $th = $('th:contains("COVID-19 Case Count")');
    const $table = $th.closest('table');
    {
      const $tr = $table.find('*:contains("Positive")').closest('tr');
      const $dataTd = $tr.find('td:last-child');
      cases = parse.number($dataTd.text());
    }
    {
      const $tr = $table.find('*:contains("Deaths")').closest('tr');
      const $dataTd = $tr.find('td:last-child');
      deaths = parse.number($dataTd.text());
    }
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
