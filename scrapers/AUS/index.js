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
  country: 'AUS',
  url: 'https://www.health.gov.au/news/health-alerts/novel-coronavirus-2019-ncov-health-alert/coronavirus-covid-19-current-situation-and-case-numbers',
  type: 'table',
  priority: 1,
  aggregate: 'state',
  async scraper() {
    const states = [];
    const $ = await fetch.page(this.url);
    const $table = $('.health-table__responsive > table');
    const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const state = parse.string($tr.find('td:first-child').text());
      const cases = parse.number($tr.find('td:nth-child(2)').text());
      states.push({
        state,
        cases
      });
    });
    states.push(transform.sumData(states));
    return states;
  }
};

export default scraper;
