import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';

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
