import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'USA',
  state: 'NJ',
  aggregate: 'county',
  source: {
    url: 'https://www.nj.gov/health/cd/topics/covid2019_dashboard.shtml'
  },
  scraper: {
    '0': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/8840fd8ac1314f5188e6cf98b525321c_0.csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.COUNTY_LAB),
          cases: parse.number(county.Positives),
          tested: parse.number(county.Negatives) + parse.number(county.Positives)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-19': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/84737ef7f760486293b6afa536f028e0_0.csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.COUNTY_LAB),
          cases: parse.number(county.Field2 || 0)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-25': async function() {
      this._metadataURL =
        'https://services7.arcgis.com/Z0rixLlManVefxqY/arcgis/rest/services/DailyCaseCounts/FeatureServer/0?f=json';
      const metadata = await fetch.json(this._metadataURL);

      this.url = `https://opendata.arcgis.com/datasets/${metadata.serviceItemId}_0.csv`;
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.COUNTY_LAB),
          cases: parse.number(county.TOTAL_CASES || 0)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
