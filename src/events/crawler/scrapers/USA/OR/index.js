import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'OR',
  country: 'USA',
  url: 'https://www.oregon.gov/oha/PH/DISEASESCONDITIONS/DISEASESAZ/Pages/emerging-respiratory-infections.aspx',
  type: 'table',
  aggregate: 'county',
  _counties: [
    'Baker County',
    'Benton County',
    'Clackamas County',
    'Clatsop County',
    'Columbia County',
    'Coos County',
    'Crook County',
    'Curry County',
    'Deschutes County',
    'Douglas County',
    'Gilliam County',
    'Grant County',
    'Harney County',
    'Hood River County',
    'Jackson County',
    'Jefferson County',
    'Josephine County',
    'Klamath County',
    'Lake County',
    'Lane County',
    'Lincoln County',
    'Linn County',
    'Malheur County',
    'Marion County',
    'Morrow County',
    'Multnomah County',
    'Polk County',
    'Sherman County',
    'Tillamook County',
    'Umatilla County',
    'Union County',
    'Wallowa County',
    'Wasco County',
    'Washington County',
    'Wheeler County',
    'Yamhill County'
  ],
  scraper: {
    '0': async function() {
      let counties = [];
      const $ = await fetch.headless(this.url);
      const $table = $('table[summary="Cases by County in Oregon for COVID-19"]');
      const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = geography.addCounty(parse.string($tr.find('td:first-child').text()));
        const cases = parse.number($tr.find('td:nth-child(2)').text());
        counties.push({
          county,
          cases
        });
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-18': async function() {
      let counties = [];
      const $ = await fetch.headless(this.url);
      const $table = $('th:contains("County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = geography.addCounty(parse.string($tr.find('td:first-child').text()));
        const cases = parse.number($tr.find('td:nth-child(2)').text());
        const deaths = parse.number($tr.find('td:nth-child(3)').text());
        const tested = parse.number($tr.find('td:nth-child(4)').text()) + cases;
        counties.push({
          county,
          cases,
          deaths,
          tested
        });
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    }
  }
};

export default scraper;
