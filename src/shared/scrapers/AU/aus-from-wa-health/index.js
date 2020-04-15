import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

import maintainers from '../../../lib/maintainers.js';
import areNumbersClose from '../_shared/are-numbers-close.js';

// WA Health has Death counts for the whole country by state,
// even though the federal government doesn't in an accessible format.
// It seems slightly delayed compared to the federal government case count.

const countryLevelMap = {
  'Australian Capital Territory': 'iso2:AU-ACT',
  'New South Wales': 'iso2:AU-NSW',
  'Northern territory': 'iso2:AU-NT',
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
  priority: 0.5,
  sources: [
    {
      description: 'Government of Western Australia, Department of Health',
      name: 'WA Health',
      url: 'https://ww2.health.wa.gov.au'
    }
  ],
  type: 'table',
  url: 'https://ww2.health.wa.gov.au/Articles/A_E/Coronavirus/COVID19-statistics',
  async scraper() {
    const states = [];
    const $ = await fetch.page(this, this.url, 'default');
    const $table = $('h2:contains("in Australia") + table');
    const $ths = $table.find('th');

    const columnLabelsByIndex = [];
    $ths.each((index, th) => {
      const $th = $(th);
      columnLabelsByIndex[index] = $th.text().toLowerCase();
    });

    const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
    $trs.each((index, tr) => {
      const $tds = $(tr).find('td');
      const rowData = {};
      $tds.each((index, td) => {
        const $td = $(td);
        rowData[columnLabelsByIndex[index]] = $td.text();
      });
      rowData.state = countryLevelMap[rowData.state];
      assert(rowData.state, `${rowData.state} not found in countryLevelMap`);
      rowData.cases = parse.number(rowData.cases);
      rowData.deaths = parse.number(rowData.deaths);
      states.push(rowData);
    });

    const summedData = transform.sumData(states);
    states.push(summedData);

    const totalRow = $table.find('tbody > tr:last-child > td:nth-child(2)').text();
    const casesFromTotalRow = parse.number(totalRow);

    assert(casesFromTotalRow > 0, `Total row is not reasonable ${casesFromTotalRow}`);
    assert(
      areNumbersClose(summedData.cases, casesFromTotalRow),
      'Summed total is not anywhere close to number in total row'
    );
    return states;
  }
};

export default scraper;
