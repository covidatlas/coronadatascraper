import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'FL',
  country: 'USA',
  priority: 1,
  aggregate: 'county',
  sources: [
    {
      url: 'http://www.floridahealth.gov',
      name: 'Florida Health'
    }
  ],
  _counties: [
    'Alachua County',
    'Baker County',
    'Bay County',
    'Bradford County',
    'Brevard County',
    'Broward County',
    'Calhoun County',
    'Charlotte County',
    'Citrus County',
    'Clay County',
    'Collier County',
    'Columbia County',
    'DeSoto County',
    'Dixie County',
    'Duval County',
    'Escambia County',
    'Flagler County',
    'Franklin County',
    'Gadsden County',
    'Gilchrist County',
    'Glades County',
    'Gulf County',
    'Hamilton County',
    'Hardee County',
    'Hendry County',
    'Hernando County',
    'Highlands County',
    'Hillsborough County',
    'Holmes County',
    'Indian River County',
    'Jackson County',
    'Jefferson County',
    'Lafayette County',
    'Lake County',
    'Lee County',
    'Leon County',
    'Levy County',
    'Liberty County',
    'Madison County',
    'Manatee County',
    'Marion County',
    'Martin County',
    'Miami-Dade County',
    'Monroe County',
    'Nassau County',
    'Okaloosa County',
    'Okeechobee County',
    'Orange County',
    'Osceola County',
    'Palm Beach County',
    'Pasco County',
    'Pinellas County',
    'Polk County',
    'Putnam County',
    'St. Johns County',
    'St. Lucie County',
    'Santa Rosa County',
    'Sarasota County',
    'Seminole County',
    'Sumter County',
    'Suwannee County',
    'Taylor County',
    'Union County',
    'Volusia County',
    'Wakulla County',
    'Walton County',
    'Washington County'
  ],
  _countyMap: {
    Dade: 'Miami-Dade',
    Desoto: 'DeSoto'
  },
  _getCountyName(testCountyName) {
    const lowerCountyName = testCountyName.toLowerCase();
    for (const countyName of this._counties) {
      if (countyName.toLowerCase() === lowerCountyName) {
        return countyName;
      }
    }
    return transform.toTitleCase(testCountyName);
  },
  scraper: {
    '0': async function() {
      this.type = 'table';
      this.url = 'http://www.floridahealth.gov/diseases-and-conditions/COVID-19/index.html';
      const countiesMap = {};
      const $ = await fetch.page(this.url);
      const $table = $('*:contains("Diagnosed in Florida")').closest('table');
      const $trs = $table.find('tr');
      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        const $tr = $(tr);
        const county = geography.addCounty(parse.string($tr.find('td:nth-child(2)').text()));
        countiesMap[county] = countiesMap[county] || { cases: 0 };
        countiesMap[county].cases += 1;
      });
      let counties = transform.objectToArray(countiesMap);
      const text = $('div:contains("Non-Florida Residents")')
        .last()
        .text();
      const nonFlorida = text.split(' \u2013 ')[0];
      if (nonFlorida) {
        counties.push({
          name: UNASSIGNED,
          cases: nonFlorida
        });
      }

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-3-16': async function() {
      this.type = 'csv';
      this.url = 'https://opendata.arcgis.com/datasets/b4930af3f43a48138c70bca409b5c452_0.csv';
      const data = await fetch.csv(this.url);
      let counties = [];
      for (const county of data) {
        counties.push({
          county: geography.addCounty(parse.string(county.County)),
          cases: parse.number(county.Counts)
        });
      }

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-3-20': async function() {
      this.type = 'json';
      this.url =
        'https://services1.arcgis.com/CY1LXxl9zlJeBuRZ/arcgis/rest/services/Florida_Testing/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=4891&geometry=%7B%22xmin%22%3A-10018754.1713954%2C%22ymin%22%3A2504688.542850271%2C%22xmax%22%3A-7514065.628547024%2C%22ymax%22%3A5009377.085698649%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%2C%22latestWkid%22%3A3857%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&resultType=tile';
      const data = await fetch.json(this.url);

      let counties = [];
      for (const county of data.features) {
        let countyName = this._getCountyName(geography.addCounty(parse.string(county.attributes.COUNTYNAME)));
        if (countyName === 'Unknown County') {
          countyName = UNASSIGNED;
        }
        if (countyName === 'Dade County') {
          countyName = 'Miami-Dade County';
        }

        counties.push({
          county: countyName,
          cases: parse.number(county.attributes.T_positive || 0),
          tested: parse.number(county.attributes.T_total || 0),
          deaths: parse.number(county.attributes.FLandNonFLDeaths || 0)
        });
      }

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-3-25': async function() {
      this.type = 'csv';
      this.url = await fetch.getArcGISCSVURL(1, '74c7375b03894e68920c2d0131eef1e6', 'Florida_Testing');
      const data = await fetch.csv(this.url);

      let counties = [];
      for (const county of data) {
        let countyName = this._getCountyName(geography.addCounty(parse.string(county.COUNTYNAME)));
        if (countyName === 'Unknown County') {
          countyName = UNASSIGNED;
        }
        if (countyName === 'Dade County') {
          countyName = 'Miami-Dade County';
        }

        counties.push({
          county: countyName,
          cases: parse.number(county.T_positive || 0),
          tested: parse.number(county.T_total || 0),
          deaths: parse.number(county.FLandNonFLDeaths || 0)
        });
      }

      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    },
    '2020-3-30': async function() {
      this.type = 'csv';
      this.url = 'https://opendata.arcgis.com/datasets/a7887f1940b34bf5a02c6f7f27a5cb2c_0.csv';
      const data = await fetch.csv(this.url);
      let counties = [];

      const unassigned = {
        county: UNASSIGNED,
        cases: 0,
        tested: 0,
        deaths: 0
      };

      for (const county of data) {
        let countyName = this._countyMap[county.County_1] || county.County_1;
        if (countyName === 'Unknown') {
          unassigned.cases += parse.number(county.CasesAll);
          unassigned.tested += parse.number(county.T_total);
          unassigned.deaths += parse.number(county.FLResDeaths);
        } else {
          countyName = geography.addCounty(parse.string(countyName));
          counties.push({
            county: countyName,
            cases: parse.number(county.CasesAll),
            tested: parse.number(county.T_total),
            deaths: parse.number(county.FLResDeaths)
          });
        }
      }
      counties.push(unassigned);
      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      return counties;
    }
  }
};

export default scraper;
