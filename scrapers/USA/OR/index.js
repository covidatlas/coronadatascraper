import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'OR',
  country: 'USA',
  url: 'https://www.oregon.gov/oha/PH/DISEASESCONDITIONS/DISEASESAZ/Pages/emerging-respiratory-infections.aspx',
  type: 'table',
  aggregate: 'county',
  scraper: {
    '0': async function() {
      const counties = [];
      const $ = await fetch.headless(this.url);
      const $table = $('table[summary="Cases by County in Oregon for COVID-19"]');
      const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = transform.addCounty(parse.string($tr.find('td:first-child').text()));
        const cases = parse.number($tr.find('td:nth-child(2)').text());
        counties.push({
          county,
          cases
        });
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-18': async function() {
      const counties = [];
      const $ = await fetch.headless(this.url);
      const $table = $('th:contains("County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = transform.addCounty(parse.string($tr.find('td:first-child').text()));
        const cases = parse.number($tr.find('td:nth-child(2)').text());
        const deaths = parse.number($tr.find('td:last-child').text());
        counties.push({
          county,
          cases,
          deaths
        });
      });
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
