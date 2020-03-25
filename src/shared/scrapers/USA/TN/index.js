import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'TN',
  country: 'USA',
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
  scraper: {
    '0': async function() {
      let counties = [];
      const $ = await fetch.page(this.url);
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
    '2020-3-21': async function() {
      let counties = [];
      const $ = await fetch.page(this.url);
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
    }
  }
};

export default scraper;
