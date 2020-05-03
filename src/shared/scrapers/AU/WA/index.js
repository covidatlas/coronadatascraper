import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';
import getDataWithTestedNegativeApplied from '../../../utils/get-data-with-tested-negative-applied.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';

const schemaKeysByHeadingFragment = {
  'cases (positive)': 'cases',
  'tested (negative)': 'testedNegative',
  tests: 'tested',
  recovered: 'recovered',
  deaths: 'deaths',
  'unknown source': null
};

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'Government of Western Australia, Department of Health',
      name: 'WA Health',
      url: 'https://ww2.health.wa.gov.au'
    }
  ],
  state: 'iso2:AU-WA',
  type: 'table',
  url: 'https://ww2.health.wa.gov.au/Articles/A_E/Coronavirus/COVID19-statistics',
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    const $table = $('table:first-of-type');
    const $trs = $table.find('tbody > tr:not(:first-child)');
    const data = {};
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const key = getSchemaKeyFromHeading({ heading: $tr.find('td:first-child').text(), schemaKeysByHeadingFragment });
      if (key) {
        data[key] = parse.number($tr.find('td:last-child').text());
      }
    });

    assert(data.cases > 0, 'Cases is not reasonable');
    return getDataWithTestedNegativeApplied(data);
  }
};

export default scraper;
