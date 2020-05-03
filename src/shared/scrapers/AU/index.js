import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import assertTotalsAreReasonable from './_shared/assert-totals-are-reasonable.js';
import getIso2FromName from '../../utils/get-iso2-from-name.js';
import getSchemaKeyFromHeading from '../../utils/get-schema-key-from-heading.js';
import maintainers from '../../lib/maintainers.js';
import normalizeTable from '../../utils/normalize-table.js';

const country = 'iso1:AU';

const schemaKeysByHeadingFragment = {
  'confirmed cases': 'cases',
  deaths: 'deaths',
  jurisdiction: 'state',
  location: 'state'
};

const scraper = {
  aggregate: 'state',
  country,
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
  url: 'https://www.health.gov.au/resources/total-covid-19-cases-and-deaths-by-states-and-territories',
  scraper: {
    '0': async function() {
      this.url =
        'https://www.health.gov.au/news/health-alerts/novel-coronavirus-2019-ncov-health-alert/coronavirus-covid-19-current-situation-and-case-numbers';
      const $ = await fetch.page(this, this.url, 'default');

      const normalizedTable = normalizeTable({ $, tableSelector: '.health-table__responsive > table' });

      const headingRowIndex = 0;
      const dataKeysByColumnIndex = [];
      normalizedTable[headingRowIndex].forEach((heading, index) => {
        dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
      });

      // Create new array with just the state data (no headings, comments, totals)
      const stateDataRows = normalizedTable.slice(1, -2);

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
          cases: parse.number(stateData.cases)
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
    },
    '2020-04-02': async function() {
      this.headless = true;
      const $ = await fetch.headless(this, this.url, 'default');

      const normalizedTable = normalizeTable({ $, tableSelector: '.ng-scope table' });

      const headingRowIndex = 0;
      const dataKeysByColumnIndex = [];
      normalizedTable[headingRowIndex].forEach((heading, index) => {
        dataKeysByColumnIndex[index] = heading
          ? getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
          : null;
      });

      const totalLabel = 'Australia';
      // Create new array with just the state data (no headings, comments, totals)
      const stateDataRows = normalizedTable.filter(row =>
        row.every(cell => cell !== totalLabel && cell !== 'Jurisdiction')
      );

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
          state: `iso2:AU-${stateData.state}`,
          cases: parse.number(stateData.cases),
          deaths: parse.number(stateData.deaths)
        });
      });

      const summedData = transform.sumData(states);
      states.push(summedData);

      const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases');
      const casesFromTotalRow = parse.number(
        normalizedTable.find(row => row.some(column => column === totalLabel))[indexForCases]
      );
      assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow });
      return states;
    }
  }
};

export default scraper;
