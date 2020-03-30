import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'GBR',
  state: 'Scotland',
  url: 'https://www.gov.scot/coronavirus-covid-19/',
  aggregate: 'county',
  type: 'table',
  scraper: {
    '0': async function() {
      function findText(node) {
        const immediateChild = node.children[0];
        const isText = immediateChild.type === 'text';
        return isText ? immediateChild.data : findText(immediateChild);
      }

      const counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('tbody').first();
      $table.children('tr').each((i, item) => {
        const columns = $(item).children('td');
        const name = findText(columns[0]);
        const confirmedCases = findText(columns[1]);
        counties.push({
          county: name,
          cases: parse.number(confirmedCases)
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-29': async function() {
      const counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('td:contains("Positive cases")').closest('table');
      $table.find('tr:not(:first-child)').each((i, tr) => {
        const $tr = $(tr);
        counties.push({
          county: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  }
};

export default scraper;
