import * as fetch from '../../../lib/fetch.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'AR',
  country: 'USA',
  url:
    'https://services.arcgis.com/PwY9ZuZRDiI5nXUB/ArcGIS/rest/services/ADH_COVID19_Positive_Test_Results/FeatureServer/0/query?where=positive%3E0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=county_nam%2Cpositive%2CRecoveries%2Cdeaths%2Ctotal_tests&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=',
  type: 'json',
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

    for (const record of data.features) {
      const rec = record.attributes;

      // county_nam,positive,Recoveries,deaths,total_tests
      let county = geography.addCounty(rec.county_nam);
      const cases = rec.positive;
      const { deaths } = rec;
      const recovered = rec.Recoveries;
      const tested = rec.total_tests;

      if (county === 'Missing County Info County') {
        county = UNASSIGNED;
      }

      counties.push({
        county,
        cases,
        deaths,
        recovered,
        tested
      });
    }

    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
