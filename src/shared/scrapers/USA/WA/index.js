import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'WA',
  country: 'USA',
  sources: [
    {
      url: 'https://www.doh.wa.gov/',
      name: 'Washington State Department of Health'
    }
  ],
  aggregate: 'county',

  _counties: [
    'Kitsap County',
    'Mason County',
    'Skamania County',
    'Wahkiakum County',
    'Columbia County',
    'Garfield County',
    'Stevens County',
    'Thurston County',
    'Walla Walla County',
    'Whatcom County',
    'Whitman County',
    'Yakima County',
    'Adams County',
    'Asotin County',
    'Benton County',
    'Chelan County',
    'Clallam County',
    'Clark County',
    'Cowlitz County',
    'Douglas County',
    'Ferry County',
    'Franklin County',
    'Grant County',
    'Grays Harbor County',
    'Island County',
    'Jefferson County',
    'King County',
    'Kittitas County',
    'Klickitat County',
    'Lewis County',
    'Lincoln County',
    'Okanogan County',
    'Pacific County',
    'Pend Oreille County',
    'Pierce County',
    'San Juan County',
    'Skagit County',
    'Snohomish County',
    'Spokane County'
  ],

  scraper: {
    '0': async function() {
      let counties = [];
      this.url = 'https://www.doh.wa.gov/Emergencies/Coronavirus';
      this.type = 'table';
      this.headless = true;
      const $ = await fetch.headless(this.url);
      const $th = $('th:contains("(COVID-19) in Washington")');
      const $table = $th.closest('table');
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const cases = parse.number($tr.find('> *:nth-child(2)').text());
        const deaths = parse.number($tr.find('> *:last-child').text());
        let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));
        if (county === 'Unassigned County') {
          county = UNASSIGNED;
        }
        if (index < 1 || index > $trs.get().length - 2) {
          return;
        }
        counties.push({
          county,
          cases,
          deaths
        });
      });
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-19': async function() {
      let counties = [];
      this.url = 'https://www.doh.wa.gov/Emergencies/Coronavirus';
      this.type = 'table';
      this.headless = true;
      const $ = await fetch.headless(this.url);
      const $table = $('caption:contains("Number of Individuals Tested")')
        .first()
        .closest('table');
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const cases = parse.number(parse.string($tr.find('td:nth-child(2)').text()) || 0);
        const deaths = parse.number(parse.string($tr.find('td:last-child').text()) || 0);

        let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));
        if (county === 'Unassigned County') {
          county = UNASSIGNED;
        }
        if (index < 1 || index > $trs.get().length - 2) {
          return;
        }
        counties.push({
          county,
          cases,
          deaths
        });
      });
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-23': async function() {
      let counties = [];
      this.url = 'https://www.doh.wa.gov/Emergencies/Coronavirus';
      this.type = 'table';
      this.headless = true;
      const $ = await fetch.headless(this.url);
      const $table = $('caption:contains("Confirmed Cases")')
        .first()
        .closest('table');

      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const cases = parse.number(parse.string($tr.find('td:nth-child(2)').text()) || 0);
        const deaths = parse.number(parse.string($tr.find('td:last-child').text()) || 0);

        let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));
        if (county === 'Unassigned County') {
          county = UNASSIGNED;
        }
        if (county === 'Total County') {
          return;
        }
        counties.push({
          county,
          cases,
          deaths
        });
      });
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-30': async function() {
      let counties = [];
      this.url =
        'https://services8.arcgis.com/rGGrs6HCnw87OFOT/arcgis/rest/services/CountyCases/FeatureServer/0/query?f=json&where=(CV_State_Cases%3E0)&returnGeometry=false&outFields=*&orderByFields=CNTY_NAME%20asc';
      this.type = 'json';
      this.headless = false;
      const data = await fetch.json(this.url);

      data.features.forEach(item => {
        const cases = item.attributes.CV_PositiveCases;
        const deaths = item.attributes.CV_Deaths;
        const county = geography.addCounty(item.attributes.CNTY_NAME);

        if (datetime.scrapeDateIsBefore(item.attributes.CV_Updated)) {
          throw new Error(`Data only available until ${new Date(item.attributes.CV_Updated).toLocaleString()}`);
        }

        counties.push({
          county,
          cases,
          deaths
        });
      });

      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    }
  }
};

export default scraper;
