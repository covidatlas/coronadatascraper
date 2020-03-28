import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'ID',
  country: 'USA',
  sources: [
    {
      name: 'IDHW',
      description: 'Idaho Department of Health and Welfare'
    }
  ],
  url: 'https://coronavirus.idaho.gov',
  type: 'table',
  aggregate: 'county',

  _counties: [
    'Ada County',
    'Adams County',
    'Bannock County',
    'Bear Lake County',
    'Benewah County',
    'Bingham County',
    'Blaine County',
    'Boise County',
    'Bonner County',
    'Bonneville County',
    'Boundary County',
    'Butte County',
    'Camas County',
    'Canyon County',
    'Caribou County',
    'Cassia County',
    'Clark County',
    'Clearwater County',
    'Custer County',
    'Elmore County',
    'Franklin County',
    'Fremont County',
    'Gem County',
    'Gooding County',
    'Idaho County',
    'Jefferson County',
    'Jerome County',
    'Kootenai County',
    'Latah County',
    'Lemhi County',
    'Lewis County',
    'Lincoln County',
    'Madison County',
    'Minidoka County',
    'Nez Perce County',
    'Oneida County',
    'Owyhee County',
    'Payette County',
    'Power County',
    'Shoshone County',
    'Teton County',
    'Twin Falls County',
    'Valley County',
    'Washington County'
  ],

  async scraper() {
    const $ = await fetch.page(this.url);

    const $th = $('th:contains("Public Health District")');
    const $table = $th.closest('table');
    const $tds = $table.find('td');

    let counties = [];

    let county = null;
    let cases = 0;
    let deaths = 0;

    $tds.each((index, td) => {
      const $td = $(td);
      const columnNum = parse.number($td.attr('class').slice(-1));

      if (columnNum === 2) {
        county = geography.addCounty(parse.string($td.text()));
      } else if (columnNum === 3) {
        cases = parse.number($td.text());
      } else if (columnNum === 4) {
        deaths = parse.number($td.text());

        // There is no Placer County in Idaho?!
        if (county !== 'TOTAL County' && county !== 'Placer County') {
          counties.push({
            county,
            cases,
            deaths
          });
        }

        county = null;
        cases = 0;
        deaths = 0;
      }
    });

    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
