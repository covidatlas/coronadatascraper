import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'LA',
  country: 'USA',
  aggregate: 'county',
  sources: [
    {
      url: 'http://ldh.la.gov/',
      name: 'Louisiana Department of Health'
    }
  ],
  _countyMap: { 'La Salle Parish': 'LaSalle Parish' },
  scraper: {
    '0': async function() {
      this.url = 'http://ldh.la.gov/Coronavirus/';
      this.type = 'table';
      const counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('p:contains("Louisiana Cases")').nextAll('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        if (index < 3) {
          return;
        }
        const $tr = $(tr);
        const county = `${parse.string($tr.find(`td:nth-last-child(2)`).text())} Parish`;
        const $tds = $tr.find('td');
        if ($tds.get(0).length > 2 && !$tds.first().attr('rowspan')) {
          return;
        }
        const cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county: geography.getCounty(this._countyMap[county] || county),
          cases
        });
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-14': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/cba425c2e5b8421c88827dc0ec8c663b_0.csv';
      this.type = 'csv';
      const counties = [];
      const data = await fetch.csv(this.url);
      const unassigned = {
        county: UNASSIGNED,
        cases: 0,
        deaths: 0
      };
      for (const county of data) {
        if (
          county.PARISH === 'Out of State Resident' ||
          county.PARISH === 'Out of State' ||
          county.PARISH === 'Under Investigation' ||
          county.PARISH === 'Parish Under Investigation'
        ) {
          unassigned.cases += parse.number(county.Cases);
          unassigned.deaths += parse.number(county.Deaths);
          continue;
        }
        const countyName = `${parse.string(county.PARISH)} Parish`;
        counties.push({
          county: geography.getCounty(this._countyMap[countyName] || countyName),
          cases: parse.number(county.Cases),
          deaths: parse.number(county.Deaths)
        });
      }
      counties.push(unassigned);
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-17': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/79e1165ecb95496589d39faa25a83ad4_0.csv';
      this.type = 'csv';
      const counties = [];
      const data = await fetch.csv(this.url);
      const unassigned = {
        county: UNASSIGNED,
        cases: 0,
        deaths: 0
      };
      for (const county of data) {
        if (
          county.PARISH === 'Out of State Resident' ||
          county.PARISH === 'Out of State' ||
          county.PARISH === 'Under Investigation' ||
          county.PARISH === 'Parish Under Investigation'
        ) {
          unassigned.cases += parse.number(county.Cases);
          unassigned.deaths += parse.number(county.Deaths);
          continue;
        }
        const countyName = `${parse.string(county.PARISH)} Parish`;
        counties.push({
          county: geography.getCounty(this._countyMap[countyName] || countyName),
          cases: parse.number(county.Cases),
          deaths: parse.number(county.Deaths)
        });
      }
      counties.push(unassigned);
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-19': async function() {
      this.url =
        'https://services5.arcgis.com/O5K6bb5dZVZcTo5M/arcgis/rest/services/Cases_by_Parish_2/FeatureServer/0/query?f=json&where=PFIPS%20%3C%3E%2099999&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Deaths%20desc%2CCases%20desc%2CParish%20asc&resultOffset=0&resultRecordCount=65&cacheHint=true';
      this.type = 'json';

      const data = await fetch.json(this.url);
      const unassigned = {
        county: UNASSIGNED,
        cases: 0,
        deaths: 0
      };
      const counties = [];
      for (const feature of data.features) {
        const county = feature.attributes;
        if (
          county.Parish === 'Out of State Resident' ||
          county.Parish === 'Out of State' ||
          county.Parish === 'Under Investigation' ||
          county.Parish === 'Parish Under Investigation'
        ) {
          unassigned.cases += parse.number(county.Cases);
          unassigned.deaths += parse.number(county.Deaths);
          continue;
        }
        const countyName = `${parse.string(county.Parish)} Parish`;
        counties.push({
          county: geography.getCounty(this._countyMap[countyName] || countyName, 'LA'),
          cases: parse.number(county.Cases),
          deaths: parse.number(county.Deaths)
        });
      }

      counties.push(unassigned);
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
