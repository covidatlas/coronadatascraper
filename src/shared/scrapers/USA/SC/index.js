import * as fetch from '../../../lib/fetch/index.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as parse from '../../../lib/parse.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'SC',
  country: 'USA',
  url:
    'https://services2.arcgis.com/XZg2efAbaieYAXmu/arcgis/rest/services/COVID19_County_View/FeatureServer/0/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc&resultOffset=0&resultRecordCount=1000&cacheHint=true',
  source: {
    name: 'South Carolina Department of Health and Environmental Control',
    url:
      'https://www.scdhec.gov/infectious-diseases/viruses/coronavirus-disease-2019-covid-19/monitoring-testing-covid-19'
  },
  type: 'json',
  aggregate: 'county',

  _counties: [
    'Abbeville County',
    'Aiken County',
    'Allendale County',
    'Anderson County',
    'Bamberg County',
    'Barnwell County',
    'Beaufort County',
    'Berkeley County',
    'Calhoun County',
    'Charleston County',
    'Cherokee County',
    'Chester County',
    'Chesterfield County',
    'Clarendon County',
    'Colleton County',
    'Darlington County',
    'Dillon County',
    'Dorchester County',
    'Edgefield County',
    'Fairfield County',
    'Florence County',
    'Georgetown County',
    'Greenville County',
    'Greenwood County',
    'Hampton County',
    'Horry County',
    'Jasper County',
    'Kershaw County',
    'Lancaster County',
    'Laurens County',
    'Lee County',
    'Lexington County',
    'McCormick County',
    'Marion County',
    'Marlboro County',
    'Newberry County',
    'Oconee County',
    'Orangeburg County',
    'Pickens County',
    'Richland County',
    'Saluda County',
    'Spartanburg County',
    'Sumter County',
    'Union County',
    'Williamsburg County',
    'York County'
  ],

  scraper: {
    '0': async function() {
      const data = await fetch.json(this.url);
      let counties = [];

      for (const record of data.features) {
        const rec = record.attributes;

        const county = geography.addCounty(rec.NAME);
        const cases = rec.Confirmed;
        const deaths = rec.Death;
        const recovered = rec.Recovered;

        counties.push({
          county,
          cases,
          deaths,
          recovered
        });
      }

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-25': async function() {
      this.url = await fetch.getArcGISCSVURL(
        2,
        '3732035614af4246877e20c3a496e397',
        'Covid19_Cases_Centroid_SharingView'
      );
      const data = await fetch.csv(this.url);
      let counties = [];
      for (const county of data) {
        counties.push({
          county: geography.addCounty(county.NAME),
          cases: parse.number(county.Confirmed),
          deaths: parse.number(county.Death),
          recovered: parse.number(county.Recovered)
        });
      }

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-28': async function() {
      this.url = await fetch.getArcGISCSVURL(
        2,
        '3732035614af4246877e20c3a496e397',
        'COVID19_County_Polygon_SharingView2' // they started updating this view
      );
      const data = await fetch.csv(this.url);
      let counties = [];
      for (const county of data) {
        if (datetime.scrapeDateIsBefore(county.Date_)) {
          throw new Error(`Data only available until ${county.Date_}`);
        }

        counties.push({
          county: geography.addCounty(county.NAME),
          cases: parse.number(county.Confirmed),
          deaths: parse.number(county.Death)
        });
      }

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));

      return counties;
    }
  }
};

export default scraper;
