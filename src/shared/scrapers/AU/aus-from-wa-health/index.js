import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

import assertTotalsAreReasonable from '../_shared/assert-totals-are-reasonable.js';
import getIso2FromName from '../../../utils/get-iso2-from-name.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../lib/maintainers.js';
import normalizeTable from '../../../utils/normalize-table.js';

// WA Health has Death counts for the whole country by state,
// even though the federal government doesn't in an accessible format.
// It seems slightly delayed compared to the federal government case count.
const country = 'iso1:AU';

const schemaKeysByHeadingFragment = { deaths: 'deaths', state: 'state', cases: 'cases' };

const scraper = {
  aggregate: 'state',
  country,
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
    const $ = await fetch.page(this, this.url, 'default');
    const normalizedTable = normalizeTable({ $, tableSelector: 'h2:contains("in Australia") + table' });

    const headingRowIndex = 0;
    const dataKeysByColumnIndex = [];
    normalizedTable[headingRowIndex].forEach((heading, index) => {
      dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
    });

    // Create new array with just the state data (no headings, comments, totals)
    const stateDataRows = normalizedTable.slice(1, -1);

    const statesCount = 8;
    assert.equal(stateDataRows.length, statesCount, 'Wrong number of rows found');

    const states = [];
    stateDataRows.forEach(row => {
      const stateData = {};
      row.forEach((value, columnIndex) => {
        const key = dataKeysByColumnIndex[columnIndex];
        stateData[key] = value;
      });

      states.push({
        state: getIso2FromName({ country, name: stateData.state }),
        cases: parse.number(stateData.cases),
        deaths: parse.number(stateData.deaths)
      });
    });

    const summedData = transform.sumData(states);
    states.push(summedData);

    const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases');
    const casesFromTotalRow = parse.number(
      normalizedTable.find(row => row.some(column => column === 'Total'))[indexForCases]
    );
    assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow });
    return states;
  }
};

export default scraper;
