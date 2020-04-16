import * as fetch from '../../../lib/fetch/index.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-AR',
  country: 'iso1:US',
  url:
    'https://services.arcgis.com/PwY9ZuZRDiI5nXUB/ArcGIS/rest/services/ADH_COVID19_Positive_Test_Results/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*',
  type: 'json',
  sources: [
    {
      name: 'Arkanas Department of Health',
      url: 'https://www.healthy.arkansas.gov/programs-services/topics/novel-coronavirus'
    }
  ],
  maintainers: [maintainers.aed3],
  aggregate: 'county',
  _counties: [
    'Arkansas County',
    'Ashley County',
    'Baxter County',
    'Benton County',
    'Boone County',
    'Bradley County',
    'Calhoun County',
    'Carroll County',
    'Chicot County',
    'Clark County',
    'Clay County',
    'Cleburne County',
    'Cleveland County',
    'Columbia County',
    'Conway County',
    'Craighead County',
    'Crawford County',
    'Crittenden County',
    'Cross County',
    'Dallas County',
    'Desha County',
    'Drew County',
    'Faulkner County',
    'Franklin County',
    'Fulton County',
    'Garland County',
    'Grant County',
    'Greene County',
    'Hempstead County',
    'Hot Spring County',
    'Howard County',
    'Independence County',
    'Izard County',
    'Jackson County',
    'Jefferson County',
    'Johnson County',
    'Lafayette County',
    'Lawrence County',
    'Lee County',
    'Lincoln County',
    'Little River County',
    'Logan County',
    'Lonoke County',
    'Madison County',
    'Marion County',
    'Miller County',
    'Mississippi County',
    'Monroe County',
    'Montgomery County',
    'Nevada County',
    'Newton County',
    'Ouachita County',
    'Perry County',
    'Phillips County',
    'Pike County',
    'Poinsett County',
    'Polk County',
    'Pope County',
    'Prairie County',
    'Pulaski County',
    'Randolph County',
    'St. Francis County',
    'Saline County',
    'Scott County',
    'Searcy County',
    'Sebastian County',
    'Sevier County',
    'Sharp County',
    'Stone County',
    'Union County',
    'Van Buren County',
    'Washington County',
    'White County',
    'Woodruff County',
    'Yell County'
  ],
  async scraper() {
    const data = await fetch.json(this.url);
    let counties = [];

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
    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties = counties.filter(c => c.county !== UNASSIGNED);
    return counties;
  }
};

export default scraper;
