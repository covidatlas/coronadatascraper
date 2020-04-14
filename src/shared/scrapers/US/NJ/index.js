import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'iso1:US',
  state: 'iso2:US-NJ',
  aggregate: 'county',
  type: 'csv',
  source: {
    name: 'State of New Jersey Department of Health',
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
    '2020-03-19': async function() {
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
    '2020-03-25': async function() {
      this.url = await fetch.getArcGISCSVURL(7, 'ec4bffd48f7e495182226eee7962b422', 'DailyCaseCounts');
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
    },
    '2020-03-31': async function() {
      this.url = await fetch.getArcGISCSVURL(7, 'ec4bffd48f7e495182226eee7962b422', 'DailyCaseCounts');
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.COUNTY_LAB),
          cases: parse.number(county.TOTAL_CASE || 0),
          deaths: parse.number(county.DEATHS || 0)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-04-01': async function() {
      this.url = await fetch.getArcGISCSVURL(7, 'ec4bffd48f7e495182226eee7962b422', 'DailyCaseCounts');
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.COUNTY_LAB),
          cases: parse.number(county.TOTAL_CASES || 0),
          deaths: parse.number(county.DEATHS || 0)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
