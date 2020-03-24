import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import * as datetime from '../../../lib/datetime.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';
import * as pdfUtils from '../../../lib/pdf.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

// Based on the MO scraper, which was based on NY

const scraper = {
  state: 'KS',
  country: 'USA',
  type: 'pdf',
  aggregate: 'county',
  _baseUrl: 'https://khap2.kdhe.state.ks.us/NewsRelease/COVID19/',
  source: {
    name: 'Kansas Department of Health and Environment',
    url: 'https://govstatus.egov.com/coronavirus'
  },
  maintainers: [maintainers.paulboal],
  _countyMap: {},
  _counties: [
    'Allen County',
    'Anderson County',
    'Atchison County',
    'Barber County',
    'Barton County',
    'Bourbon County',
    'Brown County',
    'Butler County',
    'Chase County',
    'Chautauqua County',
    'Cherokee County',
    'Cheyenne County',
    'Clark County',
    'Clay County',
    'Cloud County',
    'Coffey County',
    'Comanche County',
    'Cowley County',
    'Crawford County',
    'Decatur County',
    'Dickinson County',
    'Doniphan County',
    'Douglas County',
    'Edwards County',
    'Elk County',
    'Ellis County',
    'Ellsworth County',
    'Finney County',
    'Ford County',
    'Franklin County',
    'Geary County',
    'Gove County',
    'Graham County',
    'Grant County',
    'Gray County',
    'Greeley County',
    'Greenwood County',
    'Hamilton County',
    'Harper County',
    'Harvey County',
    'Haskell County',
    'Hodgeman County',
    'Jackson County',
    'Jefferson County',
    'Jewell County',
    'Johnson County',
    'Kearny County',
    'Kingman County',
    'Kiowa County',
    'Labette County',
    'Lane County',
    'Leavenworth County',
    'Lincoln County',
    'Linn County',
    'Logan County',
    'Lyon County',
    'Marion County',
    'Marshall County',
    'McPherson County',
    'Meade County',
    'Miami County',
    'Mitchell County',
    'Montgomery County',
    'Morris County',
    'Morton County',
    'Nemaha County',
    'Neosho County',
    'Ness County',
    'Norton County',
    'Osage County',
    'Osborne County',
    'Ottawa County',
    'Pawnee County',
    'Phillips County',
    'Pottawatomie County',
    'Pratt County',
    'Rawlins County',
    'Reno County',
    'Republic County',
    'Rice County',
    'Riley County',
    'Rooks County',
    'Rush County',
    'Russell County',
    'Saline County',
    'Scott County',
    'Sedgwick County',
    'Seward County',
    'Shawnee County',
    'Sheridan County',
    'Sherman County',
    'Smith County',
    'Stafford County',
    'Stanton County',
    'Stevens County',
    'Sumner County',
    'Thomas County',
    'Trego County',
    'Wabaunsee County',
    'Wallace County',
    'Washington County',
    'Wichita County',
    'Wilson County',
    'Woodson County',
    'Wyandotte County'
  ],
  scraper: {
    '2020-03-18': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
      const datePart = datetime.getMonthDYYYY(date);
      this.url = `${this._baseUrl}COVID-19_${datePart}_.pdf`;

      const body = await fetch.pdf(this.url);

      if (body === null) {
        throw new Error(`No data for ${date}`);
      }

      const rows = pdfUtils.asRows(body).map(row => row.map(col => col.text));

      const counties = [];
      const startIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Positive Case Information')) + 2;

      for (let i = startIndex; i < rows.length; i++) {
        const data = rows[i];
        if (data[0].includes('County') || data[1] === parse.number(data[1])) {
          // First set of columns
          const countyName1 = geography.addCounty(data[0]);
          const cases1 = data[1];

          if (this._counties.indexOf(countyName1) !== -1) {
            counties.push({
              county: countyName1,
              cases: parse.number(cases1)
            });
          }

          // Optional second set of columns
          if (data.length === 4) {
            const countyName2 = geography.addCounty(data[2]);
            const cases2 = data[3];

            if (this._counties.indexOf(countyName2) !== -1) {
              counties.push({
                county: countyName2,
                cases: parse.number(cases2)
              });
            }
          }
        }
      }

      const summedData = transform.sumData(counties);
      counties.push(summedData);

      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
