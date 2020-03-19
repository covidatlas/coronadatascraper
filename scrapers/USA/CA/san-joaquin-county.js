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
  county: 'San Joaquin County',
  state: 'CA',
  country: 'USA',
  url: 'http://www.sjcphs.org/coronavirus.aspx#res',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      this.type = 'paragraph';
      const h3 = $('h6:contains("confirmed cases of COVID-19")')
        .first()
        .text();
      const cases = parse.number(h3.match(/\((\d+)\)/)[1]);
      return { cases };
    },
    '2020-3-17': async function() {
      const $ = await fetch.page(this.url);
      this.type = 'table';
      const $table = $('h3:contains("San Joaquin County COVID-19 Numbers at a Glance")').closest('table');
      const $headers = $table.find('tbody > tr:nth-child(2) > td');
      const $numbers = $table.find('tbody > tr:nth-child(3) > td');
      let cases = 0;
      let deaths = 0;
      $headers.each((index, td) => {
        const $td = $(td);
        if ($td.text().includes('Cases')) {
          cases = parse.number($numbers.eq(index).text());
        }
        if ($td.text().includes('Deaths')) {
          deaths = parse.number($numbers.eq(index).text());
        }
      });
      return {
        cases,
        deaths
      };
    }
  }
};

export default scraper;
