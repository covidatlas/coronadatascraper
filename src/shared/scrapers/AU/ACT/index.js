import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import getDataWithTestedNegativeApplied from '../../../utils/get-data-with-tested-negative-applied.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../lib/maintainers.js';
import normalizeTable from '../../../utils/normalize-table.js';
import transposeArrayOfArrays from '../../../utils/transpose-array-of-arrays.js';

const schemaKeysByHeadingFragment = {
  'confirmed case': 'cases',
  negative: 'testedNegative',
  recovered: 'recovered',
  'lives lost': 'deaths'
};

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'ACT Government Health Department',
      name: 'ACT Government Health',
      url: 'https://www.health.act.gov.au'
    }
  ],
  state: 'iso2:AU-ACT',
  type: 'table',
  url: 'https://www.covid19.act.gov.au',
  scraper: {
    '0': async function() {
      this.url = 'https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19';
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('.statuscontent');
      const $trs = $table.find('div');
      const data = {
        deaths: 0,
        recovered: 0
      };
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const [heading, value] = $tr.text().split(': ');
        const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
        if (key) {
          data[key] = parse.number(value);
        }
      });

      assert(data.cases > 0, 'Cases is not reasonable');
      return getDataWithTestedNegativeApplied(data);
    },
    '2020-03-29': async function() {
      this.url = 'https://www.covid19.act.gov.au/updates/confirmed-case-information';
      const $ = await fetch.page(this, this.url, 'default');
      const normalizedTable = transposeArrayOfArrays(
        normalizeTable({ $, tableSelector: 'h2:contains("Cases") + table' })
      );

      const headingRowIndex = 0;
      const dataKeysByColumnIndex = [];
      normalizedTable[headingRowIndex].forEach((heading, index) => {
        dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
      });

      const dataRow = normalizedTable[normalizedTable.length - 1];

      const data = {};
      dataRow.forEach((value, columnIndex) => {
        const key = dataKeysByColumnIndex[columnIndex];
        if (key) {
          data[key] = parse.number(value);
        }
      });

      assert(data.cases > 0, 'Cases are not reasonable');
      return getDataWithTestedNegativeApplied(data);
    },
    '2020-04-09': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const normalizedTable = transposeArrayOfArrays(
        normalizeTable({ $, tableSelector: '.spf-article-card--tabular table' })
      );

      const headingRowIndex = 0;
      const dataKeysByColumnIndex = [];
      normalizedTable[headingRowIndex].forEach((heading, index) => {
        dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
      });

      const dataRow = normalizedTable[normalizedTable.length - 1];

      const data = {};
      dataRow.forEach((value, columnIndex) => {
        const key = dataKeysByColumnIndex[columnIndex];
        if (key) {
          data[key] = parse.number(value);
        }
      });

      assert(data.cases > 0, 'Cases are not reasonable');
      return getDataWithTestedNegativeApplied(data);
    }
  }
};

export default scraper;
