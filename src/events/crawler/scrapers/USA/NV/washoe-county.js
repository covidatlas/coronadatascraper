import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Washoe County',
  state: 'NV',
  country: 'USA',
  url:
    'https://www.washoecounty.us/health/programs-and-services/communicable-diseases-and-epidemiology/educational_materials/COVID-19.php',
  sources: [
    {
      name: 'Washoe County Health District',
      url: 'https://www.washoecounty.us/health/',
      description: 'Washoe County, Nevada health department'
    }
  ],
  type: 'table',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $span = $('span:contains("COVID-19 Case Count in Washoe County")');
      const regexCases = /COVID-19 Case Count in Washoe County: (\d+)/;
      const regexRecovered = /COVID-19 Cases Who Fully Recovered: (\d+)/;
      const cases = parse.number(regexCases.exec($span[0].children[0].data)[1]);
      const recovered = parse.number(regexRecovered.exec($span[0].children[2].data)[1]);
      return {
        cases,
        recovered
      };
    },
    '2020-3-26': async function() {
      return {
        cases: 67,
        recovered: 4,
        deaths: 0
      };
    },
    '2020-3-X': async function() {
      // Deaths: https://services.arcgis.com/iCGWaR7ZHc5saRIl/arcgis/rest/services/Cases_public/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID%2Cdeaths%2Creportdt%2Cname&orderByFields=reportdt%20asc&resultOffset=0&resultRecordCount=2000&cacheHint=true
      // Recovered: https://services.arcgis.com/iCGWaR7ZHc5saRIl/arcgis/rest/services/Cases_public/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID%2Crecovered%2Creportdt%2Cname&orderByFields=reportdt%20asc&resultOffset=0&resultRecordCount=2000&cacheHint=true
      // Confirmed: https://services.arcgis.com/iCGWaR7ZHc5saRIl/arcgis/rest/services/Cases_public/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID%2Cconfirmed%2Creportdt%2Cname&orderByFields=reportdt%20asc&resultOffset=0&resultRecordCount=2000&cacheHint=true
      // Active: https://services.arcgis.com/iCGWaR7ZHc5saRIl/arcgis/rest/services/Cases_public/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID%2Cactive%2Creportdt%2Cname&orderByFields=reportdt%20asc&resultOffset=0&resultRecordCount=2000&cacheHint=true
    }
  }
};

export default scraper;
