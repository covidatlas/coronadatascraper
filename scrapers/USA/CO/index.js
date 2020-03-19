import path from 'path';
import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as rules from '../../../lib/rules.js';
import * as fs from '../../../lib/fs.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'CO',
  country: 'USA',
  url: 'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub',
  type: 'list',
  scraper: {
    '0': async function() {
      this.url = 'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub';
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
          let county = transform.addCounty(parse.string(matches[1]));
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
              county: transform.addCounty(parse.string(county)),
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
      this.url = 'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub';
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
    }
  }
};

export default scraper;
