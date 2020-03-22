import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MD',
  country: 'USA',
  aggregate: 'county',
  scraper: {
    '0': async function() {
      this.url = 'https://coronavirus.maryland.gov/';
      this.type = 'paragraph';
      const counties = [];
      const $ = await fetch.headless(this.url);
      const paragraph = $('p:contains("Number of Confirmed Cases:")')
        .next('p')
        .text();
      paragraph.split(')').forEach(splitCounty => {
        if (splitCounty.length > 1) {
          let county = parse.string(splitCounty.substring(0, splitCounty.indexOf('(')).trim());
          if (county !== 'Baltimore City') {
            county = geography.addCounty(county);
          }
          const cases = parse.number(splitCounty.substring(splitCounty.indexOf('(') + 1, splitCounty.length).trim());
          counties.push({
            county,
            cases
          });
        }
      });
      return counties;
    },
    '2020-3-17': async function() {
      this.type = 'csv';
      this.url = 'https://opendata.arcgis.com/datasets/3d9ca88970dd4689a701354d7fa6830b_0.csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        let countyName;
        if (county.COUNTY === 'Baltimore City') {
          countyName = parse.string(county.COUNTY);
        } else {
          countyName = geography.addCounty(parse.string(county.COUNTY));
        }
        counties.push({
          county: countyName,
          cases: parse.number(county.COVID19Cases),
          deaths: parse.number(county.COVID19Deaths),
          tested: parse.number(county.COVID19Recovered)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
