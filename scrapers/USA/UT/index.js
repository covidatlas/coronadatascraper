import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'UT',
  country: 'USA',
  aggregate: 'county',
  scraper: {
    '0': async function() {
      this.url = 'https://coronavirus.utah.gov/latest/';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const counties = [];
      const $table = $('th:contains("District")').closest('table');
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = parse.string($tr.find('td:first-child').text());
        const cases = parse.number($tr.find('td:last-child').text());
        if (index > 0 && county.indexOf('Non-Utah') === -1) {
          counties.push({
            county: transform.addCounty(county),
            cases
          });
        }
      });

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-19': async function() {
      this.url = 'https://coronavirus-dashboard.utah.gov/';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const counties = [];

      const script = $('script[type="application/json"]').html();
      const { data } = JSON.parse(script).x;

      for (const [index, county] of Object.entries(data[0])) {
        if (county === 'State Total') {
          continue;
        }
        counties.push({
          county: transform.addCounty(county),
          cases: parse.number(data[1][index]) + parse.number(data[2][index])
        });
      }

      counties.push({
        tested: parse.number($('#reported-people-tested .value-output').text()),
        cases: parse.number($('#covid-19-cases .value-output').text())
      });

      return counties;
    }
  }
};

export default scraper;
