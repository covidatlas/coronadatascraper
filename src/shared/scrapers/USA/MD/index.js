import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MD',
  country: 'USA',
  aggregate: 'county',
  sources: [
    {
      url: 'https://health.maryland.gov/',
      name: 'Maryland Department of Health'
    }
  ],
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
          recovered: parse.number(county.COVID19Recovered)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-25': async function() {
      // 2020-3-24 is the last day this was updated
      this.type = 'csv';
      this.url = await fetch.getArcGISCSVURL(
        '',
        'c34e541dd8b742d993159dbebb094d8b',
        'MD_COVID19_Case_Counts_by_County'
      );
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
          recovered: parse.number(county.COVID19Recovered)
        });
      }
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
