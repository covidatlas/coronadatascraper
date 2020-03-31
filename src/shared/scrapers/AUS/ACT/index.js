import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import getDataWithTestedNegativeApplied from '../_shared/get-data-with-tested-negative-applied.js';
import getKey from '../_shared/get-key.js';
import maintainers from '../../../lib/maintainers.js';

const labelFragmentsByKey = [
  { cases: 'confirmed case' },
  { testedNegative: 'tested negative' },
  { recovered: 'recovered' },
  { deaths: 'lives lost' }
];

const pivotTheTable = ($trs, $) => {
  const dataPairs = [];
  $trs.each((trIndex, tr) => {
    const $tr = $(tr);
    const $tds = $tr.find('td, th');
    $tds.each((tdIndex, td) => {
      const $td = $(td);
      dataPairs[tdIndex] = dataPairs[tdIndex] || [];
      dataPairs[tdIndex][trIndex] = $td.text();
    });
  });
  return dataPairs;
};

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'ACT Government Health Department',
      name: 'ACT Government Health',
      url: 'https://www.health.act.gov.au'
    }
  ],
  state: 'Australian Capital Territory',
  type: 'table',
  url: 'https://www.covid19.act.gov.au/updates/confirmed-case-information',
  scraper: {
    '0': async function() {
      const $ = await fetch.page('https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19');
      const $table = $('.statuscontent');
      const $trs = $table.find('div');
      const data = {
        deaths: 0,
        recovered: 0
      };
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const [label, value] = $tr.text().split(': ');
        const key = getKey({ label, labelFragmentsByKey });
        data[key] = parse.number(value);
      });

      assert(data.cases > 0, 'Cases is not reasonable');
      return getDataWithTestedNegativeApplied(data);
    },
    '2020-3-29': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('h2:contains("Cases") + table');
      const $trs = $table.find('tr');

      const dataPairs = pivotTheTable($trs, $);

      const data = {};
      dataPairs.forEach(([label, value]) => {
        const key = getKey({ label, labelFragmentsByKey });
        data[key] = parse.number(value);
      });

      assert(data.cases > 0, 'Cases is not reasonable');
      return getDataWithTestedNegativeApplied(data);
    }
  }
};

export default scraper;
