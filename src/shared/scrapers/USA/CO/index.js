import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as rules from '../../../lib/rules.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'CO',
  country: 'USA',
  aggregate: 'county',
  priority: 1,
  scraper: {
    '0': async function() {
      this.url =
        'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub';
      this.type = 'list';
      const $ = await fetch.page(this.url);
      const counties = [];
      const $lis = $('p:contains("Positive cases by county of residence")')
        .nextAll('ul')
        .first()
        .find('li');
      $lis.each((index, li) => {
        const matches = $(li)
          .text()
          .match(/(.*?): (\d+)/);
        if (matches) {
          let county = geography.addCounty(parse.string(matches[1]));
          if (county === 'Unknown county County') {
            county = UNASSIGNED;
          }
          const data = {
            county,
            cases: parse.number(matches[2])
          };
          counties.push(data);
        }
      });
      const visitorCounties = [];
      const $visitors = $('p:contains("Positive cases by county of residence")')
        .nextAll('p')
        .find('span');
      $visitors.each((index, visitor) => {
        const visitorInfo = $(visitor)
          .text()
          .match(/([A-Za-z]+) - (\d+)/);
        if (visitorInfo !== null && visitorInfo.length === 3) {
          const county = `${visitorInfo[1]} County`;
          const cases = visitorInfo[2];
          if (county.indexOf('information') === -1) {
            const data = {
              county: geography.addCounty(parse.string(county)),
              cases: parse.number(cases)
            };
            if (rules.isAcceptable(data, null, this._reject)) {
              visitorCounties.push(data);
            }
          }
        }
      });
      counties.forEach(county => {
        if (county.cases !== undefined && county.county !== undefined) {
          visitorCounties.forEach(visitorCounty => {
            if (visitorCounty.cases !== undefined && visitorCounty.county !== undefined) {
              if (visitorCounty.county === county.county) {
                county.cases = visitorCounty.cases + county.cases;
              }
            }
          });
        }
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-15': async function() {
      this.url =
        'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub';
      this.type = 'paragraph';
      const $ = await fetch.page(this.url);
      return {
        cases: parse.number(
          $('span:contains("Positive")')
            .text()
            .split(':')[1]
        ),
        tested: parse.number(
          $('span:contains("Total number of people tested")')
            .text()
            .split(':')[1]
        )
      };
    },
    '2020-3-18': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/46c727cc29424b1fb9db67554c7df04e_0.csv';
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.FULL_),
          cases: parse.number(county.Number_of_COVID_positive_cases_)
        });
      }
      const stateData = transform.sumData(counties);
      counties.push(stateData);
      return counties;
    },
    '2020-3-19': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/dec84f18254341419c514af8f9e784ba_0.csv';
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.FULL_),
          cases: parse.number(county.Number_of_COVID_positive_cases_)
        });
      }
      const stateData = transform.sumData(counties);
      counties.push(stateData);
      return counties;
    },
    '2020-3-20': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/fbae539746324ca69ff34f086286845b_0.csv';
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.FULL_),
          cases: parse.number(county.County_Pos_Cases)
        });
      }
      const stateData = transform.sumData(counties);
      stateData.deaths = parse.number(data[0].State_Deaths);
      counties.push(stateData);
      return counties;
    }
  }
};

export default scraper;
