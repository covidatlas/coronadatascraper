import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'WV',
  country: 'USA',
  sources: [
    {
      url: 'https://dhhr.wv.gov',
      name: 'West Virginia Department of Health & Human Resources'
    }
  ],
  url: 'https://dhhr.wv.gov/COVID-19/Pages/default.aspx',
  type: 'list',
  aggregate: 'county',

  _counties: [
    'Barbour County',
    'Berkeley County',
    'Boone County',
    'Braxton County',
    'Brooke County',
    'Cabell County',
    'Calhoun County',
    'Clay County',
    'Doddridge County',
    'Fayette County',
    'Gilmer County',
    'Grant County',
    'Greenbrier County',
    'Hampshire County',
    'Hancock County',
    'Hardy County',
    'Harrison County',
    'Jackson County',
    'Jefferson County',
    'Kanawha County',
    'Lewis County',
    'Lincoln County',
    'Logan County',
    'McDowell County',
    'Marion County',
    'Marshall County',
    'Mason County',
    'Mercer County',
    'Mineral County',
    'Mingo County',
    'Monongalia County',
    'Monroe County',
    'Morgan County',
    'Nicholas County',
    'Ohio County',
    'Pendleton County',
    'Pleasants County',
    'Pocahontas County',
    'Preston County',
    'Putnam County',
    'Raleigh County',
    'Randolph County',
    'Ritchie County',
    'Roane County',
    'Summers County',
    'Taylor County',
    'Tucker County',
    'Tyler County',
    'Upshur County',
    'Wayne County',
    'Webster County',
    'Wetzel County',
    'Wirt County',
    'Wood County',
    'Wyoming County'
  ],

  async scraper() {
    const $ = await fetch.page(this.url);

    const $p = $('p:contains("Counties with positive cases")');

    const list = $p
      .text()
      .split(':')[1]
      .split(',');

    let counties = [];

    for (const item of list) {
      const items = item.split('(');
      if (items.length !== 2) {
        continue;
      }

      const county = geography.addCounty(parse.string(items[0]));
      let cases = items[1];

      if (cases.slice(-1) !== ')') {
        continue;
      }

      cases = parse.number(cases.slice(0, -1));

      counties.push({
        county,
        cases
      });
    }

    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
