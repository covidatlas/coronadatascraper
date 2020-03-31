import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';
import getDataWithTestedNegativeApplied from '../_shared/get-data-with-tested-negative-applied.js';
import getKey from '../_shared/get-key.js';

const labelFragmentsByKey = [
  { cases: 'cases (positive)' },
  { tested: 'tested (negative)' },
  { recovered: 'recovered' },
  { deaths: 'deaths' },
  { discard: 'unknown source' }
];

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'Government of Western Australia, Department of Health',
      name: 'WA Health',
      url: 'https://ww2.health.wa.gov.au'
    }
  ],
  state: 'Western Australia',
  type: 'table',
  url: 'https://ww2.health.wa.gov.au/Articles/A_E/Coronavirus/COVID19-statistics',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('table:first-of-type');
    const $trs = $table.find('tbody > tr:not(:first-child)');
    const data = {};
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const key = getKey({ label: $tr.find('td:first-child').text(), labelFragmentsByKey });
      data[key] = parse.number($tr.find('td:last-child').text());
    });

    assert(data.cases > 0, 'Cases is not reasonable');
    return getDataWithTestedNegativeApplied(data);
  }
};

export default scraper;
