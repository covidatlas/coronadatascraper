import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';

const scraper = {
  country: 'iso1:TW',
  level: 'country',
  aggregate: 'country',
  url: 'https://covid19dashboard.cdc.gov.tw/dash3',
  timeseries: false,
  sources: [
    {
      name: 'Taiwan CDC',
      url: 'https://sites.google.com/cdc.gov.tw/2019-ncov/taiwan',
      description: 'Taiwan CDC'
    }
  ],
  type: 'json',
  async scraper() {
    function swapKeys(obj, keys) {
      for (const [k1, k2] of Object.entries(keys)) {
        obj[k2] = obj[k1];
        delete obj[k1];
      }
      return obj;
    }

    const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();

    const country = {
      date,
      country: this.country
    };

    const schemaKeysByHeading = {
      確診: 'cases',
      解除隔離: 'recovered',
      死亡: 'deaths',
      送驗: 'tested',
      '排除(新)': 'negative' // Test Result
    };

    const dash3options = {
      headers: {
        Origin: 'https://919644827-atari-embeds.googleusercontent.com'
      }
    };
    const dash3raw = await fetch.json(this, 'https://covid19dashboard.cdc.gov.tw/dash3', 'default', date, dash3options);

    const dash3 = swapKeys(dash3raw[0], schemaKeysByHeading);

    Object.values(schemaKeysByHeading).forEach(function(k) {
      country[k] = parse.number(dash3[k]) || 0;
    });

    assert(country.cases > 0, 'Cases are not reasonable');

    return [country];

    /** Data for timeseries, in case we want to convert this to a timeseries!

    // Cases by Reporting Source
    const testSourceSchemaKeys = {
      通報日: 'date',
      法定傳染病通報: 'medicalRecords', // Infections Disease Notification System http://at.cdc.tw/M4MS01
      居家檢疫送驗: 'quarantine',
      擴大監測送驗: 'testingCriteria', //  http://at.cdc.tw/zU3557
      Total: 'tested'
    };

    const dash4 = await fetch.json(this, 'https://covid19dashboard.cdc.gov.tw/dash4', 'default', date);
    const testSources = {};

    Object.keys(dash4).forEach(function(i) {
      testSources[i] = {};
      Object.keys(dash4[i]).forEach(function(k) {
        if (testSourceSchemaKeys[k] === 'date') {
          testSources[i][testSourceSchemaKeys[k]] = datetime.getYYYYMMDD(dash4[i][k]);
        } else {
          testSources[i][testSourceSchemaKeys[k]] = parse.number(dash4[i][k]) || 0;
        }
      });
    });

    // Confirmed (symptomatic) cases by onset date - asymptomatic cases aren't included because of no onset date
    const caseSourceSchemaKeys = {
      發病日: 'date',
      本土感染: 'local',
      境外移入: 'imported',
      敦睦艦隊: 'panshi' //  http://at.cdc.tw/470o1i
    };

    const dash5 = await fetch.json(this, 'https://covid19dashboard.cdc.gov.tw/dash5', 'default', date);

    const caseSources = {};

    Object.keys(dash5).forEach(function(i) {
      caseSources[i] = {};
      Object.keys(dash5[i]).forEach(function(k) {
        if (caseSourceSchemaKeys[k] === 'date') {
          caseSources[i][caseSourceSchemaKeys[k]] = datetime.getYYYYMMDD(dash5[i][k]);
        } else {
          caseSources[i][caseSourceSchemaKeys[k]] = parse.number(dash5[i][k]) || 0;
        }
      });
    });

    */
  }
};

export default scraper;
