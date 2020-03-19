import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';

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
  state: 'FL',
  country: 'USA',
  priority: 1,
  aggregate: 'county',
  async scraper() {
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      this.type = 'table';
      this.url = 'http://www.floridahealth.gov/diseases-and-conditions/COVID-19/index.html';
      const counties = {};
      const $ = await fetch.page(this.url);
      const $table = $('*:contains("Diagnosed in Florida")').closest('table');
      const $trs = $table.find('tr');
      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        const $tr = $(tr);
        const county = transform.addCounty(parse.string($tr.find('td:nth-child(2)').text()));
        counties[county] = counties[county] || { cases: 0 };
        counties[county].cases += 1;
      });
      const countiesArray = transform.objectToArray(counties);
      const text = $('div:contains("Non-Florida Residents")')
        .last()
        .text();
      const nonFlorida = text.split(' \u2013 ')[0];
      if (nonFlorida) {
        countiesArray.push({
          name: UNASSIGNED,
          cases: nonFlorida
        });
      }
      countiesArray.push(transform.sumData(countiesArray));
      return countiesArray;
    }
    this.type = 'csv';
    this.url = 'https://opendata.arcgis.com/datasets/b4930af3f43a48138c70bca409b5c452_0.csv';
    const data = await fetch.csv(this.url);
    const counties = [];
    for (const county of data) {
      counties.push({
        county: transform.addCounty(parse.string(county.County)),
        cases: parse.number(county.Counts)
      });
    }
    return counties;
  }
};

export default scraper;
