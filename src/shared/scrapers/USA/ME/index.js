import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'ME',
  country: 'USA',
  sources: [
    {
      url: 'https://www.maine.gov/dhhs/mecdc',
      name: 'MeCDC',
      description: 'Maine Center for Disease Control & Prevention'
    }
  ],
  url: 'https://www.maine.gov/dhhs/mecdc/infectious-disease/epi/airborne/coronavirus.shtml',
  type: 'table',
  aggregate: 'county',

  _counties: [
    'Androscoggin County',
    'Aroostook County',
    'Cumberland County',
    'Franklin County',
    'Hancock County',
    'Kennebec County',
    'Knox County',
    'Lincoln County',
    'Oxford County',
    'Penobscot County',
    'Piscataquis County',
    'Sagadahoc County',
    'Somerset County',
    'Waldo County',
    'Washington County',
    'York County'
  ],

  async scraper() {
    let counties = [];
    const $ = await fetch.page(this.url);
    const $th = $('th:contains("Case Counts by County")');
    const $table = $th.closest('table');

    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      if (index < 1) {
        return;
      }

      const $tr = $(tr);
      let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));
      const cases = parse.number($tr.find('> *:nth-child(2)').text());
      const recovered = parse.number(parse.string($tr.find('> *:nth-child(3)').text()) || 0);
      const deaths = parse.number(parse.string($tr.find('> *:nth-child(4)').text()));

      if (county === 'Unknown County') {
        county = UNASSIGNED;
      }
      counties.push({
        county,
        cases,
        recovered,
        deaths
      });
    });
    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
