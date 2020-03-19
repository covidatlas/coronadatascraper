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
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'OH',
  country: 'USA',
  aggregate: 'county',
  async scraper() {
    const counties = [];
    let arrayOfCounties = [];
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      this.url = 'https://odh.ohio.gov/wps/portal/gov/odh/know-our-programs/Novel-Coronavirus/welcome/';
      const $ = await fetch.page(this.url);
      const $paragraph = $('p:contains("Number of counties with cases:")').text();
      const regExp = /\(([^)]+)\)/;
      const parsed = regExp.exec($paragraph);
      arrayOfCounties = parsed[1].split(',');
    } else {
      this.url = 'https://coronavirus.ohio.gov/wps/portal/gov/covid-19/';
      const $ = await fetch.page(this.url);
      const $paragraph = $('p:contains("Number of counties with cases:")').text();
      const parsed = $paragraph.replace(/([()])/g, '').replace('* Number of counties with cases: ', '');
      arrayOfCounties = parsed.split(',');
    }
    arrayOfCounties.forEach(county => {
      const splitCounty = county.trim().split(' ');
      counties.push({
        county: transform.addCounty(parse.string(splitCounty[0])),
        cases: parse.number(splitCounty[1])
      });
    });
    return counties;
  }
};

export default scraper;
