import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'WA',
  country: 'USA',
  url: 'https://www.doh.wa.gov/Emergencies/Coronavirus',
  type: 'table',
  headless: true,
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
    }
  }
};

export default scraper;
