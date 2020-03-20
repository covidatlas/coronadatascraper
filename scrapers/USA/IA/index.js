import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'IA',
  country: 'USA',
  url: 'https://idph.iowa.gov/emerging-health-issues/novel-coronavirus',
  type: 'table',
  aggregate: 'county',
  headless: true,
  scraper: {
    '0': async function() {
      const counties = [];
      const $ = await fetch.headless(this.url);
      const $table = $('caption:contains("Reported Cases in Iowa by County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = transform.addCounty(
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
    '2020-2-19': async function() {
      throw new Error('Iowa is putting an image on their site, not data!');
    }
  }
};

export default scraper;
