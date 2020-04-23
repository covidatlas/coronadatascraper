import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as htmlTableValidation from '../../../lib/html/table-validation.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-PA',
  country: 'iso1:US',
  aggregate: 'county',
  sources: [
    {
      url: 'https://www.health.pa.gov/',
      name: 'Pennsylvania Department of Health'
    }
  ],
  _counties: [
    'Adams County',
    'Allegheny County',
    'Armstrong County',
    'Beaver County',
    'Bedford County',
    'Berks County',
    'Blair County',
    'Bradford County',
    'Bucks County',
    'Butler County',
    'Cambria County',
    'Cameron County',
    'Carbon County',
    'Centre County',
    'Chester County',
    'Clarion County',
    'Clearfield County',
    'Clinton County',
    'Columbia County',
    'Crawford County',
    'Cumberland County',
    'Dauphin County',
    'Delaware County',
    'Elk County',
    'Erie County',
    'Fayette County',
    'Forest County',
    'Franklin County',
    'Fulton County',
    'Greene County',
    'Huntingdon County',
    'Indiana County',
    'Jefferson County',
    'Juniata County',
    'Lackawanna County',
    'Lancaster County',
    'Lawrence County',
    'Lebanon County',
    'Lehigh County',
    'Luzerne County',
    'Lycoming County',
    'McKean County',
    'Mercer County',
    'Mifflin County',
    'Monroe County',
    'Montgomery County',
    'Montour County',
    'Northampton County',
    'Northumberland County',
    'Perry County',
    'Philadelphia County',
    'Pike County',
    'Potter County',
    'Schuylkill County',
    'Snyder County',
    'Somerset County',
    'Sullivan County',
    'Susquehanna County',
    'Tioga County',
    'Union County',
    'Venango County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Westmoreland County',
    'Wyoming County',
    'York County'
  ],
  scraper: {
    '0': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx';
      this.type = 'list';
      const $ = await fetch.page(this, this.url, 'default');
      let counties = [];
      const $lis = $('li:contains("Counties impacted to date include")')
        .nextAll('ul')
        .first()
        .find('li');
      $lis.each((index, li) => {
        const matches = $(li)
          .text()
          .match(/([A-Za-z]+) \((\d+\))/);
        if (matches) {
          const county = geography.getCounty(geography.addCounty(parse.string(matches[1])), 'iso2:US-PA');
          const cases = parse.number(matches[2]);
          counties.push({
            county,
            cases
          });
        }
      });
      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-03-16': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx';
      this.type = 'table';
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('table.ms-rteTable-default').first();
      const $trs = $table.find('tbody > tr');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          county: geography.getCounty(
            geography.addCounty(parse.string($tr.find('td:first-child').text())),
            'iso2:US-PA'
          ),
          cases: parse.number($tr.find('td:last-child').text())
        };
        counties.push(data);
      });
      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-03-17': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx';
      this.type = 'table';
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('table.ms-rteTable-default').eq(1);
      const $trs = $table.find('tbody > tr');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          county: geography.getCounty(
            geography.addCounty(parse.string($tr.find('td:first-child').text())),
            'iso2:US-PA'
          ),
          cases: parse.number($tr.find('td:last-child').text())
        };
        counties.push(data);
      });
      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-03-18': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx';
      this.type = 'table';
      const $ = await fetch.page(this, this.url, 'default');
      const $countyTable = $('th:contains("County")').closest('table');
      const $trs = $countyTable.find('tbody > tr:not(:first-child)');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        counties.push({
          county: geography.getCounty(
            geography.addCounty(parse.string($tr.find('td:first-child').text())),
            'iso2:US-PA'
          ),
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
        });
      });
      const $stateTable = $('table.ms-rteTable-default').eq(0);
      const stateData = transform.sumData(counties);
      stateData.tested =
        parse.number($stateTable.find('tr:last-child td:first-child').text()) +
        parse.number($stateTable.find('tr:last-child td:nth-child(2)').text());
      counties.push(stateData);
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-03-26': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx';
      this.type = 'table';
      const $ = await fetch.page(this, this.url, 'default');
      const $countyTable = $('td:contains("County")').closest('table');

      const rules = {
        headings: {
          0: /county/i,
          1: /number of cases/i,
          2: /deaths/i
        },
        data: [
          { column: 0, row: 'ANY', rule: /Adams/ },
          { column: 1, row: 'ALL', rule: /^[0-9]+$/ },
          { column: 2, row: 'ALL', rule: /(^[0-9]+|)$/ }
        ]
      };
      const opts = { includeErrCount: 5, logToConsole: true };
      htmlTableValidation.throwIfErrors($countyTable, rules, opts);

      const $trs = $countyTable.find('tbody > tr:not(:first-child)');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        counties.push({
          county: geography.getCounty(
            geography.addCounty(parse.string($tr.find('td:first-child').text())),
            'iso2:US-PA'
          ),
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
        });
      });
      const $stateTable = $('table.ms-rteTable-default').eq(0);
      const stateData = transform.sumData(counties);
      stateData.tested =
        parse.number($stateTable.find('tr:last-child td:first-child').text()) +
        parse.number($stateTable.find('tr:last-child td:nth-child(2)').text());
      counties.push(stateData);
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-04-15': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx';
      this.type = 'table';
      const $ = await fetch.page(this, this.url, 'default');
      const $countyTable = $('td:contains("County")')
        .closest('table')
        .first();

      const $trs = $countyTable.find('tbody > tr:not(:first-child)');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        counties.push({
          county: geography.getCounty(
            geography.addCounty(parse.string($tr.find('td:first-child').text())),
            'iso2:US-PA'
          ),
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
        });
      });

      const $stateTable = $('table.ms-rteTable-default').eq(0);
      const stateData = transform.sumData(counties);
      stateData.tested =
        parse.number($stateTable.find('tr:last-child td:first-child').text()) +
        parse.number($stateTable.find('tr:last-child td:nth-child(2)').text());
      counties.push(stateData);

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-04-16': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx';
      this.type = 'table';
      const $ = await fetch.page(this, this.url, 'default');
      const $countyTable = $('td:contains("County")')
        .closest('table')
        .first();

      const $trs = $countyTable.find('tbody > tr:not(:first-child)');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        counties.push({
          county: geography.getCounty(
            geography.addCounty(parse.string($tr.find('td:first-child').text())),
            'iso2:US-PA'
          ),
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          tested: parse.number($tr.find('td:nth-child(2)').text()) + parse.number($tr.find('td:nth-child(3)').text()),
          deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
        });
      });

      const $stateTable = $('table.ms-rteTable-default').eq(0);
      const stateData = transform.sumData(counties);
      stateData.tested =
        parse.number($stateTable.find('tr:last-child td:first-child').text()) +
        parse.number($stateTable.find('tr:last-child td:nth-child(2)').text());
      counties.push(stateData);

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    }
  }
};

export default scraper;
