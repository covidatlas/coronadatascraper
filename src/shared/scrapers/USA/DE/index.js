import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as rules from '../../../lib/rules.js';
import * as datetime from '../../../lib/datetime.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'DE',
  country: 'USA',
  aggregate: 'county',
  sources: [
    {
      url: 'https://www.dhss.delaware.gov/dhss/dph',
      name: 'DHSS Division of Public Health',
      description: 'Delaware Health and Social Services Division of Public Health'
    }
  ],
  _reject: [
    {
      county: 'Pea Patch County'
    },
    {
      county: 'Reedy Island County'
    },
    {
      county: 'DE/NJ County'
    },
    {
      county: 'Statewide County'
    }
  ],
  scraper: {
    '0': async function() {
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        this.url = 'https://www.dhss.delaware.gov/dhss/dph/epi/2019novelcoronavirus.html';
        this.type = 'table';
        const $ = await fetch.page(this.url);
        const $td = $('*:contains("County breakdown")')
          .closest('tr')
          .find('td:last-child');
        const counties = $td
          .html()
          .split('<br>')
          .map(str => {
            const parts = str.split(': ');
            return {
              county: geography.addCounty(parse.string(parts[0])),
              cases: parse.number(parts[1])
            };
          });
        counties.push(transform.sumData(counties));
        return counties;
      }
      this.url = 'http://opendata.arcgis.com/datasets/c8d4efa2a6bd48a1a7ae074a8166c6fa_0.csv';
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const county of data) {
        const countyObj = {
          county: geography.addCounty(parse.string(county.NAME)),
          cases: parse.number(county.Presumptive_Positive),
          recovered: parse.number(county.Recovered)
        };
        if (rules.isAcceptable(countyObj, null, this._reject)) {
          counties.push(countyObj);
        }
      }
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-29': async function() {
      this.url =
        'https://services1.arcgis.com/PlCPCPzGOwulHUHo/arcgis/rest/services/DEMA_COVID_County_Boundary_Time_VIEW/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&resultOffset=0&resultRecordCount=50&cacheHint=true';
      this.type = 'json';
      const data = await fetch.json(this.url);
      const counties = [];

      for (const countyData of data.features) {
        if (typeof countyData.attributes.Presumptive_Positive !== 'undefined') {
          if (countyData.attributes.Presumptive_Positive === null) countyData.attributes.Presumptive_Positive = 0;
          if (countyData.attributes.Total_Death === null) countyData.attributes.Total_Death = 0;
          if (countyData.attributes.Recovered === null) countyData.attributes.Recovered = 0;

          const countyObj = {
            county: geography.addCounty(parse.string(countyData.attributes.NAME)),
            cases: parse.number(countyData.attributes.Presumptive_Positive),
            deaths: parse.number(countyData.attributes.Total_Death),
            recovered: parse.number(countyData.attributes.Recovered)
          };
          if (rules.isAcceptable(countyObj, null, this._reject)) {
            counties.push(countyObj);
          }
        }
      }
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
