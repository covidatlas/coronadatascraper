import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'AUS',
  url: 'https://www.health.gov.au/news/health-alerts/novel-coronavirus-2019-ncov-health-alert/coronavirus-covid-19-current-situation-and-case-numbers',
  type: 'table',
  priority: 1,
  aggregate: 'state',
  async scraper() {
    const states = [];
    const $ = await fetch.page(this.url);
    const $table = $('.health-table__responsive > table');
    const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const state = parse.string($tr.find('td:first-child').text());
      const cases = parse.number($tr.find('td:nth-child(2)').text());
      states.push({
        state,
        cases
      });
    });
    states.push(transform.sumData(states));
    return states;
  }
};

export default scraper;
