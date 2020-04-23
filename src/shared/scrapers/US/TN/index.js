import cheerioTableparser from 'cheerio-tableparser';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-TN',
  country: 'iso1:US',
  sources: [
    {
      url: 'https://www.tn.gov/health/cedep',
      name: 'Tennessee Department of Health CEDEP',
      description: 'Communicable and Environmental Diseases and Emergency Preparedness Division'
    }
  ],
  url: 'https://www.tn.gov/health/cedep/ncov.html',
  type: 'table',
  aggregate: 'county',
  _counties: [
    'Anderson County',
    'Bedford County',
    'Benton County',
    'Bledsoe County',
    'Blount County',
    'Bradley County',
    'Campbell County',
    'Cannon County',
    'Carroll County',
    'Carter County',
    'Cheatham County',
    'Chester County',
    'Claiborne County',
    'Clay County',
    'Cocke County',
    'Coffee County',
    'Crockett County',
    'Cumberland County',
    'Davidson County',
    'Decatur County',
    'DeKalb County',
    'Dickson County',
    'Dyer County',
    'Fayette County',
    'Fentress County',
    'Franklin County',
    'Gibson County',
    'Giles County',
    'Grainger County',
    'Greene County',
    'Grundy County',
    'Hamblen County',
    'Hamilton County',
    'Hancock County',
    'Hardeman County',
    'Hardin County',
    'Hawkins County',
    'Haywood County',
    'Henderson County',
    'Henry County',
    'Hickman County',
    'Houston County',
    'Humphreys County',
    'Jackson County',
    'Jefferson County',
    'Johnson County',
    'Knox County',
    'Lake County',
    'Lauderdale County',
    'Lawrence County',
    'Lewis County',
    'Lincoln County',
    'Loudon County',
    'Macon County',
    'Madison County',
    'Marion County',
    'Marshall County',
    'Maury County',
    'McMinn County',
    'McNairy County',
    'Meigs County',
    'Monroe County',
    'Montgomery County',
    'Moore County',
    'Morgan County',
    'Obion County',
    'Overton County',
    'Perry County',
    'Pickett County',
    'Polk County',
    'Putnam County',
    'Rhea County',
    'Roane County',
    'Robertson County',
    'Rutherford County',
    'Scott County',
    'Sequatchie County',
    'Sevier County',
    'Shelby County',
    'Smith County',
    'Stewart County',
    'Sullivan County',
    'Sumner County',
    'Tipton County',
    'Trousdale County',
    'Unicoi County',
    'Union County',
    'Van Buren County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Weakley County',
    'White County',
    'Williamson County',
    'Wilson County'
  ],
  _good_headers(data) {
    const validCountyHeaders = /(county|^$)/i;
    if (!validCountyHeaders.test(parse.string(data[0][0]))) {
      return false;
    }
    if (!/positive|confirmed/i.test(parse.string(data[1][0]))) {
      return false;
    }
    if (!/negative/i.test(parse.string(data[2][0]))) {
      return false;
    }
    if (data.length === 4) {
      const deathHeader = parse.string(data[3][0]);
      if (!/death/i.test(deathHeader)) {
        return false;
      }
      return true;
    }
    if (data.length === 3) {
      return true;
    }

    return false;
  },
  scraper: {
    '0': async function() {
      let counties = [];
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('th:contains("Case Count")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');

      const unassignedCounty = { county: UNASSIGNED, cases: 0 };

      $trs.each((index, tr) => {
        if (index < 1) {
          return;
        }
        const $tr = $(tr);
        const countyName = parse.string(
          $tr
            .find('td:first-child')
            .text()
            .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        );

        const cases = parse.number($tr.find('td:last-child').text());

        if (
          countyName === 'Residents Of Other States/countries' ||
          countyName === 'Unknown' ||
          countyName === 'Out Of Tn'
        ) {
          unassignedCounty.cases += cases;
          return;
        }

        if (countyName === 'Grand Total') {
          return;
        }

        counties.push({
          county: geography.addCounty(countyName),
          cases
        });
      });

      counties.push(unassignedCounty);

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-03-21': async function() {
      let counties = [];
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('th:contains("Count")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)'); // skip grand total

      const unassignedCounty = { county: UNASSIGNED, cases: 0 };

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const countyName = parse.string($tr.find('td:first-child').text());

        const cases = parse.number($tr.find('td:last-child').text());

        if (
          countyName === 'Residents Of Other States/countries' ||
          countyName === 'Unknown' ||
          countyName === 'Out of TN' ||
          !countyName
        ) {
          unassignedCounty.cases += cases;
          return;
        }

        if (countyName === 'Grand Total' || countyName === 'Pending') {
          return;
        }

        counties.push({
          county: geography.addCounty(countyName),
          cases
        });
      });

      counties.push(unassignedCounty);

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-3-31': async function() {
      let counties = [];
      const $ = await fetch.page(this, this.url, 'default');
      cheerioTableparser($);
      const $table = $('td:contains("Blount")').closest('table');
      const data = $table.parsetable(false, false, true);
      if (!this._good_headers(data)) {
        throw new Error('Unknown headers in html table');
      }

      const unassignedCounty = { county: UNASSIGNED, cases: 0, tested: 0 };
      const hasDeaths = data.length === 4;

      if (hasDeaths) {
        unassignedCounty.deaths = 0;
      }

      const numRows = data[0].length;
      // skip headers and total line
      for (let i = 1; i < numRows - 1; i++) {
        const county = geography.addCounty(parse.string(data[0][i]));
        const cases = parse.number(data[1][i]);
        const neg = parse.number(data[2][i]);
        const tested = cases + neg;

        const rec = { county, cases, tested };

        let deaths;
        if (hasDeaths) {
          deaths = parse.number(data[3][i]);
          rec.deaths = deaths;
        }

        if (!this._counties.includes(county)) {
          unassignedCounty.cases += cases;
          unassignedCounty.tested += tested;
          if (hasDeaths) {
            unassignedCounty.deaths += deaths;
          }
          continue;
        }

        counties.push(rec);
      }

      counties.push(unassignedCounty);
      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-4-11': async function() {
      this.url =
        'https://services1.arcgis.com/YuVBSS7Y1of2Qud1/arcgis/rest/services/TN_Covid_Counties/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=NAME%20asc&resultOffset=0&resultRecordCount=96&cacheHint=true';
      this.type = 'json';

      const data = await fetch.json(this, this.url, 'default');
      const counties = [];

      data.features.forEach(item => {
        const cases = item.attributes.INFECT_NUM;
        const deaths = item.attributes.DEATH_NUM;
        const county = geography.addCounty(item.attributes.NAME);
        const tested = item.attributes.INFECT_NUM + item.attributes.NegativeTests;
        const recovered = item.attributes.Recovered;

        counties.push({
          county,
          cases,
          deaths,
          tested,
          recovered
        });
      });

      const totalsUrl =
        'https://services1.arcgis.com/YuVBSS7Y1of2Qud1/ArcGIS/rest/services/TN_Covid_Total/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=pjson';
      const tmp = await fetch.json(this, totalsUrl, 'totals');
      const totalsData = tmp.features.pop().attributes;

      const totals = transform.sumData(counties);
      totals.cases = totalsData.Total_Infections;
      totals.deaths = totalsData.Total_Deaths;

      counties.push(totals);
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
