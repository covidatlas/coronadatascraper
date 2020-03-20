import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'SD',
  country: 'USA',
  url: 'https://doh.sd.gov/news/Coronavirus.aspx#SD',
  type: 'table',
  aggregate: 'county',
  _counties: [
    'Aurora County',
    'Beadle County',
    'Bennett County',
    'Bon Homme County',
    'Brookings County',
    'Brown County',
    'Brule County',
    'Buffalo County',
    'Butte County',
    'Campbell County',
    'Charles Mix County',
    'Clark County',
    'Clay County',
    'Codington County',
    'Corson County',
    'Custer County',
    'Davison County',
    'Day County',
    'Deuel County',
    'Dewey County',
    'Douglas County',
    'Edmunds County',
    'Fall River County',
    'Faulk County',
    'Grant County',
    'Gregory County',
    'Haakon County',
    'Hamlin County',
    'Hand County',
    'Hanson County',
    'Harding County',
    'Hughes County',
    'Hutchinson County',
    'Hyde County',
    'Jackson County',
    'Jerauld County',
    'Jones County',
    'Kingsbury County',
    'Lake County',
    'Lawrence County',
    'Lincoln County',
    'Lyman County',
    'Marshall County',
    'McCook County',
    'McPherson County',
    'Meade County',
    'Mellette County',
    'Miner County',
    'Minnehaha County',
    'Moody County',
    'Oglala Lakota County',
    'Pennington County',
    'Perkins County',
    'Potter County',
    'Roberts County',
    'Sanborn County',
    'Spink County',
    'Stanley County',
    'Sully County',
    'Todd County',
    'Tripp County',
    'Turner County',
    'Union County',
    'Walworth County',
    'Yankton County',
    'Ziebach County'
  ],
  scraper: {
    '0': async function() {
      let counties = [];
      const $ = await fetch.page(this.url);
      const $th = $('h2:contains("South Dakota Counties with COVID-19 Cases")');
      const $table = $th.next('table');
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        counties.push({
          county: geography.addCounty(parse.string($tr.find('> *:first-child').text())),
          cases: parse.number($tr.find('> *:last-child').text())
        });
      });
      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-3-19': async function() {
      let counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('caption:contains("SOUTH DAKOTA COUNTIES WITH COVID-19 CASES")').closest('table');
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        if ($tr.find('td').attr('colspan')) {
          return;
        }
        counties.push({
          county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    }
  }
};

export default scraper;
