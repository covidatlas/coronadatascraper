import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  aggregate: 'state',
  country: 'AUS',
  maintainer: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'Australian Government Department of Health',
      name: 'Australian Government Department of Health',
      url: 'https://www.health.gov.au/'
    }
  ],
  type: 'table',
  url:
    'https://www.health.gov.au/news/health-alerts/novel-coronavirus-2019-ncov-health-alert/coronavirus-covid-19-current-situation-and-case-numbers',
  async scraper() {
    const states = [];
    const $ = await fetch.page(this.url);
    const $table = $('.health-table__responsive > table');
    const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const state = parse.string($tr.find('td:first-child').text());
      const cases = parse.number($tr.find('td:last-child').text());
      states.push({
        state,
        cases
      });
    });
    const summedData = transform.sumData(states);
    states.push(summedData);

    const casesFromTotalRow = parse.number($table.find('tbody > tr:last-child > td:last-child').text());

    assert(casesFromTotalRow > 0, 'Total row is not reasonable');
    assert.equal(summedData.cases, casesFromTotalRow, 'Summed total is not equal to number in total row');

    return states;
  }
};

export default scraper;
