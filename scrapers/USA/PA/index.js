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
  state: 'PA',
  country: 'USA',
  url: 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx',
  type: 'list',
  aggregate: 'county',
  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      const $lis = $('li:contains("Counties impacted to date include")')
        .nextAll('ul')
        .first()
        .find('li');
      $lis.each((index, li) => {
        const matches = $(li)
          .text()
          .match(/([A-Za-z]+) \((\d+\))/);
        if (matches) {
          const county = transform.addCounty(parse.string(matches[1]));
          const cases = parse.number(matches[2]);
          counties.push({
            county,
            cases
          });
        }
      });
    } else if (datetime.scrapeDateIsBefore('2020-3-17')) {
      const $table = $('table.ms-rteTable-default').first();
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          county: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:last-child').text())
        };
        counties.push(data);
      });
    } else {
      const $countyTable = $('table.ms-rteTable-default').eq(1);
      const $trs = $countyTable.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          county: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:last-child').text())
        };
        counties.push(data);
      });
    }
    return counties;
  }
};

export default scraper;
