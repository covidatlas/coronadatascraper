import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import * as datetime from '../../../lib/datetime.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as pdfUtils from '../../../lib/pdf.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

// Based on the MO scraper, which was based on NY

const scraper = {
  state: 'KS',
  country: 'USA',
  aggregate: 'county',
  _baseUrl: 'https://khap2.kdhe.state.ks.us/NewsRelease/COVID19/',
  sources: [
    {
      name: 'Kansas Department of Health and Environment',
      url: 'https://govstatus.egov.com/coronavirus'
    },
    {
      name: 'Kansas Department of Health and Environment',
      url: 'http://www.kdheks.gov/coronavirus/COVID-19_Resource_Center.htm'
    }
  ],
  maintainers: [maintainers.paulboal, maintainers.aed3],
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
    '0': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
      const datePart = datetime.getMonthDYYYY(date);
      this.url = `${this._baseUrl}COVID-19_${datePart}_.pdf`;
      this.type = 'pdf';

      const body = await fetch.pdf(this.url);

      if (body === null) {
        throw new Error(`No data for ${date}`);
      }

      const rows = pdfUtils.asRows(body).map(row => row.map(col => col.text));

      const counties = [];
      const startIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Positive Case Information')) + 2;

      for (let i = startIndex; i < rows.length; i++) {
        const data = rows[i];

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

      const summedData = transform.sumData(counties);
      counties.push(summedData);

      return geography.addEmptyRegions(counties, this._counties, 'county');
    },
    '2020-3-28': async function() {
      this.type = 'json';
      this.url =
        'https://services9.arcgis.com/Q6wTdPdCh608iNrJ/arcgis/rest/services/COVID19_CountyStatus_KDHE/FeatureServer/0/query?f=json&where=Covid_Case%3D%27Yes%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=COUNTY%20asc&resultOffset=0&resultRecordCount=105&cacheHint=true';
      const data = await fetch.json(this.url);
      const counties = [];

      data.features.forEach(item => {
        counties.push({
          county: geography.addCounty(item.attributes.COUNTY.replace(/\W/g, '')),
          cases: item.attributes.Covid_Conf,
          deaths: item.attributes.Covid_Deat,
          recovered: item.attributes.Covid_Reco
        });
      });

      counties.push(transform.sumData(counties));
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
