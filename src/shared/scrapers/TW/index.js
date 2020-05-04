import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';

const scraper = {
  country: 'iso1:TW',
  timeseries: false,
  sources: [
    {
      name: 'Taiwan CDC',
      url: 'https://cdc.gov.tw/'
    }
  ],
  certValidation: false,
  url: 'https://www.nyecounty.net/1066/Coronavirus-COVID-19-Information',
  type: 'table',
  scraper: {
    '0': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();

      const country = {
        date,
        country: this.country,
        cases: 0,
        tested: 0
      };

      const schemaKeysByHeading = {
        送驗: 'tested',
        排除: null, // Negative Tests
        確診: 'cases',
        死亡: 'deaths',
        解除隔離: 'recovered'
      };

      console.info(schemaKeysByHeading);

      // const dash3 = await fetch.json(this, 'https://covid19dashboard.cdc.gov.tw/dash3', date);
      // Header: `Origin: https://919644827-atari-embeds.googleusercontent.com`

      const testSourceSchemaKeys = {
        通報日: 'date',
        法定傳染病通報: 'medicalRecords', // Infections Disease Notification System http://at.cdc.tw/M4MS01
        居家檢疫送驗: 'quarantine',
        擴大監測送驗: 'testingCriteria', //  http://at.cdc.tw/zU3557
        Total: 'tested'
      };

      const dash4 = await fetch.json(this, 'https://covid19dashboard.cdc.gov.tw/dash4', date);
      const testSources = {};

      Object.keys(dash4).forEach(function(i) {
        testSources[i] = {};
        Object.keys(dash4[i]).forEach(function(k) {
          if (testSourceSchemaKeys[k] === 'date') {
            testSources[i][testSourceSchemaKeys[k]] = datetime.getYYYYMMDD(dash4[i][k]);
          } else if (k === 'Total') {
            country.tested += parse.number(dash4[i][k]) || 0;
          } else {
            testSources[i][testSourceSchemaKeys[k]] = parse.number(dash4[i][k]) || 0;
          }
        });
      });

      const caseSourceSchemaKeys = {
        發病日: 'date',
        本土感染: 'local',
        境外移入: 'imported',
        敦睦艦隊: 'panshi' //  http://at.cdc.tw/470o1i
      };

      const dash5 = await fetch.json(this, 'https://covid19dashboard.cdc.gov.tw/dash5', date);

      const caseSources = {};

      Object.keys(dash5).forEach(function(i) {
        caseSources[i] = {};
        Object.keys(dash5[i]).forEach(function(k) {
          if (caseSourceSchemaKeys[k] === 'date') {
            caseSources[i][caseSourceSchemaKeys[k]] = datetime.getYYYYMMDD(dash5[i][k]);
          } else {
            caseSources[i][caseSourceSchemaKeys[k]] = parse.number(dash5[i][k]) || 0;
            country.cases += parse.number(dash5[i][k]) || 0;
          }
        });
      });

      assert(country.cases > 0, 'Cases are not reasonable');

      return country;
    }
  }
};

export default scraper;
