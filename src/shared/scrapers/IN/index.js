import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import assertTotalsAreReasonable from '../../utils/assert-totals-are-reasonable.js';
import getIso2FromName from '../../utils/get-iso2-from-name.js';
import getSchemaKeyFromHeading from '../../utils/get-schema-key-from-heading.js';
import normalizeTable from '../../utils/normalize-table.js';

const schemaKeysByHeadingFragment = {
  'name of state': 'state',
  death: 'deaths',
  'total confirmed cases': 'cases',
  cured: 'recovered',
  's. no.': null
};

const country = 'iso1:IN';

const scraper = {
  country,
  url: 'https://www.mohfw.gov.in/',
  type: 'table',
  aggregate: 'state',
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    const normalizedTable = normalizeTable({ $, tableSelector: '#state-data' });

    const headingRowIndex = 0;
    const dataKeysByColumnIndex = [];
    normalizedTable[headingRowIndex].forEach((heading, index) => {
      dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
    });

    // Create new array with just the state data (no headings, comments, totals)
    const stateDataRows = normalizedTable.filter(row => row[0].match(/^\d/));

    const states = [];
    stateDataRows.forEach(row => {
      const stateData = {};
      row.forEach((value, columnIndex) => {
        const key = dataKeysByColumnIndex[columnIndex];
        stateData[key] = value;
      });

      states.push({
        state: getIso2FromName({
          country,
          name: stateData.state
            .replace('Telengana', 'Telangana')
            .replace('Dadar Nagar Haveli', 'Dadra and Nagar Haveli')
        }),
        cases: parse.number(stateData.cases),
        deaths: parse.number(stateData.deaths),
        recovered: parse.number(stateData.recovered)
      });
    });

    const summedData = transform.sumData(states);
    states.push(summedData);

    const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases');
    const casesFromTotalRow = parse.number(
      normalizedTable.find(row => row.some(cell => cell === 'Total number of confirmed cases in India'))[indexForCases]
    );
    assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow });
    return states;
  }
};

export default scraper;
