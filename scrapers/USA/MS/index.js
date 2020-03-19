import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MS',
  country: 'USA',
  url: 'https://msdh.ms.gov/msdhsite/_static/14,0,420.html',
  type: 'table',
  aggregate: 'county',
  async scraper() {
    const $ = await fetch.page(this.url);
    if (datetime.scrapeDateIsBefore('2020-3-15')) {
      const $table = $('h3:contains("Mississippi Cases")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr');
      const counties = {};
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const status = $tr.find('td:nth-child(3)').text();
        const county = transform.addCounty(parse.string($tr.find('td:nth-child(2)').text()));
        if (status === 'Confirmed' || status === 'Presumptive') {
          counties[county] = counties[county] || { cases: 0 };
          counties[county].cases++;
        }
      });
      const countiesArray = transform.objectToArray(counties);
      counties.push(transform.sumData(countiesArray));
      return countiesArray;
    }
    const $table = $('h4:contains("All Mississippi cases to date")')
      .nextAll('table')
      .first();
    const $trs = $table.find('tbody > tr');
    const counties = [];
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const county = transform.addCounty(parse.string($tr.find('td:first-child').text()));
      counties.push({
        county,
        cases: parse.number($tr.find('td:last-child').text())
      });
    });
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
