import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';
import areNumbersClose from './_shared/are-numbers-close.js';

const countryLevelMap = {
  'Australian Capital Territory': 'iso2:AU-ACT',
  'New South Wales': 'iso2:AU-NSW',
  'Northern Territory': 'iso2:AU-NT',
  Queensland: 'iso2:AU-QLD',
  'South Australia': 'iso2:AU-SA',
  Tasmania: 'iso2:AU-TAS',
  Victoria: 'iso2:AU-VIC',
  'Western Australia': 'iso2:AU-WA'
};

const scraper = {
  aggregate: 'state',
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
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
    const $ = await fetch.page(this, this.url, 'default');
    const $table = $('.health-table__responsive > table');
    assert.equal($table.length, 1, 'table not found');

    const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const state = parse.string($tr.find('td:first-child').text());
      const cases = parse.number($tr.find('td:last-child').text());

      const stateMapped = countryLevelMap[state];
      assert(stateMapped, `${state} not found in countryLevelMap`);

      states.push({
        state: stateMapped,
        cases
      });
    });
    const summedData = transform.sumData(states);
    states.push(summedData);

    const casesFromTotalRow = parse.number($table.find('tbody > tr:last-child > td:last-child').text());

    assert(casesFromTotalRow > 0, 'Total row is not reasonable');
    assert(
      areNumbersClose(summedData.cases, casesFromTotalRow),
      'Summed total is not anywhere close to number in total row'
    );
    return states;
  }
};

export default scraper;
