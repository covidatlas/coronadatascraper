import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as rules from '../../lib/rules.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'CAN',
  url: 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html',
  type: 'table',
  _reject: [{ state: 'Repatriated travellers' }, { state: 'Total cases' }, { state: 'Total' }, { state: 'Canada' }],
  aggregate: 'state',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('h2:contains("Current situation")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr');
      const regions = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          state: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:nth-child(2)').text())
        };
        if (rules.isAcceptable(data, null, this._reject)) {
          regions.push(data);
        }
      });
      return regions;
    },
    '2020-3-27': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('th:contains("Province, territory or other")').closest('table');
      const $trs = $table.find('tbody > tr');
      const regions = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const region = parse.string($tr.find('td:first-child').text());
        const data = {
          state: region,
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          deaths: parse.number($tr.find('td:last-child').text())
        };
        if (rules.isAcceptable(data, null, this._reject)) {
          regions.push(data);
        }
      });
      return regions;
    }
  }
};

export default scraper;
