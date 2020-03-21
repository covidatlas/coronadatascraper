import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'CT',
  country: 'USA',
  url: 'https://portal.ct.gov/Coronavirus',
  type: 'list',
  aggregate: 'county',
  scraper: {
    '0': async function() {
      this.type = 'list';
      const counties = [];
      const $ = await fetch.page(this.url);
      const $lis = $('span:contains("Latest COVID-19 Testing Data in Connecticut")')
        .nextAll('ul')
        .first()
        .find('li');
      $lis.each((index, li) => {
        if (index < 1) {
          return;
        }
        const countyData = $(li)
          .text()
          .split(/:\s*/);
        counties.push({
          county: parse.string(countyData[0]),
          cases: parse.number(countyData[1])
        });
      });
      return counties;
    },
    '2020-3-18': async function() {
      this.type = 'paragraph';
      const counties = [];
      const $ = await fetch.page(this.url);
      const p = $(':contains("Fairfield County:")')
        .last()
        .text();
      const items = p.split('\n');
      for (const item of items) {
        const elements = item.split(':');
        const countyName = parse.string(elements[0]);
        const cases = parse.number(elements[1]);
        counties.push({
          county: countyName,
          cases
        });
      }
      return counties;
    },
    '2020-3-19': async function() {
      this.type = 'table';
      const counties = [];
      const $ = await fetch.page(this.url);

      const $table = $('td:contains("Fairfield County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        const $tr = $(tr);
        const countyName = geography.addCounty(parse.string($tr.find('td:first-child').text()));
        counties.push({
          county: countyName,
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
