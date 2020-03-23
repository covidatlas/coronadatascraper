import * as fetch from '../../../lib/fetch.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'AR',
  country: 'USA',
  url:
    'https://services.arcgis.com/PwY9ZuZRDiI5nXUB/ArcGIS/rest/services/ADH_COVID19_Positive_Test_Results/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*',
  type: 'json',
  sources: [
    {
      name: 'Arkanas Department of Health',
      url: 'https://www.healthy.arkansas.gov/programs-services/topics/novel-coronavirus',
      description: ''
    }
  ],
  aggregate: 'county',
  async scraper() {
    const data = await fetch.json(this.url);
    const counties = [];

    for (const countyData of data.features) {
      const attr = countyData.attributes;
      if (attr.county_nam === 'Missing County Info') {
        attr.county_nam = UNASSIGNED;
      } else {
        attr.county_nam = geography.addCounty(attr.county_nam);
      }

      counties.push({
        county: attr.county_nam,
        cases: attr.positive,
        deaths: attr.deaths,
        recovered: attr.Recoveries,
        tested: attr.total_tests
      });
    }

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
