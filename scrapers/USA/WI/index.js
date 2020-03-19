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
  state: 'WI',
  country: 'USA',
  url: 'https://www.dhs.wisconsin.gov/outbreaks/index.htm',
  type: 'table',
  aggregate: 'county',
  async scraper() {
    const regions = [];
    const $ = await fetch.page(this.url);
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      const $table = $('caption:contains("Number of Positive Results by County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      regions.push(transform.sumData(regions));
    } else {
      const $table = $('h5:contains("Number of Positive Results by County")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      {
        const stateData = { tested: 0 };
        const $table = $('h5:contains("Wisconsin COVID-19 Test Results")')
          .nextAll('table')
          .first();
        const $trs = $table.find('tbody > tr');
        $trs.each((index, tr) => {
          const $tr = $(tr);
          const label = parse.string($tr.find('td:first-child').text());
          const value = parse.number($tr.find('td:last-child').text());
          if (label === 'Positive') {
            stateData.cases = value;
            stateData.tested += value;
          } else if (label === 'Negative') {
            stateData.tested += value;
          }
        });
        regions.push(stateData);
      }
    }
    return regions;
  }
};

export default scraper;
