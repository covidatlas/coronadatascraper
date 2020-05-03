import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../lib/maintainers.js';
import normalizeTable from '../../../utils/normalize-table.js';
import transposeArrayOfArrays from '../../../utils/transpose-array-of-arrays.js';

const schemaKeysByHeadingFragment = {
  'Cases in Tasmania': null,
  'New cases': null,
  'Total cases': 'cases',
  Active: null,
  Recovered: 'recovered',
  Deaths: 'deaths'
};

const scraper = {
  country: 'iso1:AU',
  state: 'iso2:AU-TAS',
  priority: 2,
  sources: [
    {
      name: 'Tasmanian Government',
      url: 'https://www.coronavirus.tas.gov.au/facts/cases-and-testing-updates'
    }
  ],
  maintainers: [maintainers.camjc],
  url: 'https://www.coronavirus.tas.gov.au/facts/cases-and-testing-updates',
  type: 'table',
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');

    const normalizedTable = transposeArrayOfArrays(normalizeTable({ $, tableSelector: '#table12451' }));

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
    return data;
  }
};

export default scraper;
