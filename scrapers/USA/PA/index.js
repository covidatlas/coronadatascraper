import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'PA',
  country: 'USA',
  aggregate: 'county',
  scraper: {
    '0': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx';
      this.type = 'list';
      const $ = await fetch.page(this.url);
      const counties = [];
      const $lis = $('li:contains("Counties impacted to date include")')
        .nextAll('ul')
        .first()
        .find('li');
      $lis.each((index, li) => {
        const matches = $(li)
          .text()
          .match(/([A-Za-z]+) \((\d+\))/);
        if (matches) {
          const county = transform.addCounty(parse.string(matches[1]));
          const cases = parse.number(matches[2]);
          counties.push({
            county,
            cases
          });
        }
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-16': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const $table = $('table.ms-rteTable-default').first();
      const $trs = $table.find('tbody > tr');
      const counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        };
        counties.push(data);
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-17': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const $table = $('table.ms-rteTable-default').eq(1);
      const $trs = $table.find('tbody > tr');
      const counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          county: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:last-child').text())
        };
        counties.push(data);
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-18': async function scraper() {
      this.url = 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const $countyTable = $('table.ms-rteTable-default').eq(1);
      const $trs = $countyTable.find('tbody > tr:not(:first-child)');
      const counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        counties.push({
          county: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
        });
      });
      const $stateTable = $('table.ms-rteTable-default').eq(0);
      const stateData = transform.sumData(counties);
      stateData.tested = parse.number($stateTable.find('tr:last-child td:first-child').text());
      stateData.cases = parse.number($stateTable.find('tr:last-child td:last-child').text());
      counties.push(stateData);
      return counties;
    }
  }
};

export default scraper;
