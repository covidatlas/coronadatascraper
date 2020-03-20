import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'TX',
  country: 'USA',
  url: 'https://www.dshs.state.tx.us/news/updates.shtm',
  type: 'table',
  aggregate: 'county',
  ssl: false,
  certValidation: false,
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
  async scraper() {
    let counties = [];
    const $ = await fetch.page(this.url);
    let $table;
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      $table = $('table[summary="Texas COVID-19 Cases"]');
    } else {
      $table = $('table[summary="COVID-19 Cases in Texas Counties"]');
    }
    const $trs = $table.find('tbody > tr:not(:last-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const county = transform.addCounty(
        $tr
          .find('td:first-child')
          .text()
          .replace(/[\d]*/g, '')
      );
      const cases = parse.number($tr.find('td:last-child').text());
      counties.push({
        county,
        cases
      });
    });
    counties = transform.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
