import cheerioTableparser from 'cheerio-tableparser';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'ND',
  country: 'USA',
  url: 'https://www.health.nd.gov/diseases-conditions/coronavirus/north-dakota-coronavirus-cases',
  type: 'table',
  aggregate: 'county',
  sources: [
    {
      name: 'North Dakota Department of Health',
      url: 'https://www.health.nd.gov/diseases-conditions/coronavirus/north-dakota-coronavirus-cases'
    }
  ],
  _counties: [
    'Adams County',
    'Barnes County',
    'Benson County',
    'Billings County',
    'Bottineau County',
    'Bowman County',
    'Burke County',
    'Burleigh County',
    'Cass County',
    'Cavalier County',
    'Dickey County',
    'Divide County',
    'Dunn County',
    'Eddy County',
    'Emmons County',
    'Foster County',
    'Golden Valley County',
    'Grand Forks County',
    'Grant County',
    'Griggs County',
    'Hettinger County',
    'Kidder County',
    'LaMoure County',
    'Logan County',
    'McHenry County',
    'McIntosh County',
    'McKenzie County',
    'McLean County',
    'Mercer County',
    'Morton County',
    'Mountrail County',
    'Nelson County',
    'Oliver County',
    'Pembina County',
    'Pierce County',
    'Ramsey County',
    'Ransom County',
    'Renville County',
    'Richland County',
    'Rolette County',
    'Sargent County',
    'Sheridan County',
    'Sioux County',
    'Slope County',
    'Stark County',
    'Steele County',
    'Stutsman County',
    'Towner County',
    'Traill County',
    'Walsh County',
    'Ward County',
    'Wells County',
    'Williams County'
  ],
  _good_headers(data) {
    if (parse.string(data[0][0]) !== 'County') {
      return false;
    }
    if (parse.string(data[1][0]) !== 'Total Tests') {
      return false;
    }
    if (parse.string(data[2][0]) !== 'Positive Cases') {
      return false;
    }
    return true;
  },
  async scraper() {
    let counties = [];
    const $ = await fetch.page(this.url);
    cheerioTableparser($);
    const $table = $('td:contains("Positive")').closest('table');
    const data = $table.parsetable(false, false, true);

    if (!this._good_headers(data)) {
      throw new Error('Unknown headers in html table');
    }

    const numRows = data[0].length;
    const startRow = 1; // skip the headers
    for (let i = startRow; i < numRows; i++) {
      let county = parse.string(data[0][i]).split(',')[0];
      if (county === '') {
        continue;
      }
      county = geography.addCounty(county);
      if (this._counties.indexOf(county) === -1) {
        console.log(`  ⚠️  Unknown county in table: "${county}"`);
        continue;
      }
      const tested = parse.number(parse.string(data[1][i]) || 0);
      const cases = parse.number(parse.string(data[2][i]) || 0);

      counties.push({
        county,
        cases,
        tested
      });
    }
    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
