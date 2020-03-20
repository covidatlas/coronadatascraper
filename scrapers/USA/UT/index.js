import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'UT',
  country: 'USA',
  aggregate: 'county',
  _counties: [
    'Beaver County',
    'Box Elder County',
    'Cache County',
    'Carbon County',
    'Daggett County',
    'Davis County',
    'Duchesne County',
    'Emery County',
    'Garfield County',
    'Grand County',
    'Iron County',
    'Juab County',
    'Kane County',
    'Millard County',
    'Morgan County',
    'Piute County',
    'Rich County',
    'Salt Lake County',
    'San Juan County',
    'Sanpete County',
    'Sevier County',
    'Summit County',
    'Tooele County',
    'Uintah County',
    'Utah County',
    'Wasatch County',
    'Washington County',
    'Wayne County',
    'Weber County'
  ],
  _pushCounty(counties, county, cases) {
    if (county === 'State Total') {
      return;
    }
    if (county === 'TriCounty') {
      const caseShare = cases / 3;
      counties.push({
        county: geography.addCounty('Uintah'),
        cases: caseShare
      });
      counties.push({
        county: geography.addCounty('Duchesne'),
        cases: caseShare
      });
      counties.push({
        county: geography.addCounty('Daggett'),
        cases: caseShare
      });
      return;
    }
    if (county === 'Weber-Morgan') {
      const caseShare = cases / 2;
      counties.push({
        county: geography.addCounty('Weber'),
        cases: caseShare
      });
      counties.push({
        county: geography.addCounty('Morgan'),
        cases: caseShare
      });
      return;
    }
    if (county === 'Southeast Utah') {
      // ?
      return;
    }
    if (county === 'Southwest Utah') {
      // ?
      return;
    }
    if (county === 'Central Utah') {
      // ?
      return;
    }
    if (county === 'Bear River') {
      counties.push({
        city: geography.addCounty(county),
        cases
      });
      return;
    }

    counties.push({
      county: geography.addCounty(county),
      cases
    });
  },
  scraper: {
    '0': async function() {
      this.url = 'https://coronavirus.utah.gov/latest/';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      let counties = [];
      const $table = $('th:contains("District")').closest('table');
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = parse.string($tr.find('td:first-child').text());
        const cases = parse.number($tr.find('td:last-child').text());
        if (index > 0 && county.indexOf('Non-Utah') === -1) {
          this._pushCounty(counties, county, cases);
        }
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-19': async function() {
      this.url = 'https://coronavirus-dashboard.utah.gov/';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      let counties = [];

      const script = $('script[type="application/json"]').html();
      const { data } = JSON.parse(script).x;

      for (const [index, county] of Object.entries(data[0])) {
        this._pushCounty(counties, county, parse.number(data[1][index]) + parse.number(data[2][index]));
      }

      counties.push({
        tested: parse.number($('#reported-people-tested .value-output').text()),
        cases: parse.number($('#covid-19-cases .value-output').text())
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    }
  }
};

export default scraper;
