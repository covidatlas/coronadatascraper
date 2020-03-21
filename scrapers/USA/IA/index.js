import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'IA',
  country: 'USA',
  aggregate: 'county',
  headless: true,
  scraper: {
    '0': async function() {
      this.url = 'https://idph.iowa.gov/emerging-health-issues/novel-coronavirus';
      this.type = 'table';
      const counties = [];
      const $ = await fetch.headless(this.url);
      const $table = $('caption:contains("Reported Cases in Iowa by County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = geography.addCounty(
          $tr
            .find('td:first-child')
            .text()
            .replace(/[\d]*/g, '')
        );
        const cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county,
          cases
        });
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-19': async function() {
      throw new Error('Iowa is putting an image on their site, not data!');
    },
    '2020-3-20': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/6a84756c2e444a87828bb7ce699fdac6_0.csv';
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: geography.addCounty(county.Name),
          cases: parse.number(county.Confirmed || 0),
          deaths: parse.number(county.Deaths || 0),
          recovered: parse.number(county.Recovered || 0)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
