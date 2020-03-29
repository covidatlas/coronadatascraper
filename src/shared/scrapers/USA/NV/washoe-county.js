import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Washoe County',
  state: 'NV',
  country: 'USA',
  url:
    'https://www.washoecounty.us/health/programs-and-services/communicable-diseases-and-epidemiology/educational_materials/COVID-19.php',
  sources: [
    {
      name: 'Washoe County Health District',
      url: 'https://www.washoecounty.us/health/',
      description: 'Washoe County, Nevada health department'
    }
  ],
  type: 'table',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $span = $('span:contains("COVID-19 Case Count in Washoe County")');
      const regexCases = /COVID-19 Case Count in Washoe County: (\d+)/;
      const regexRecovered = /COVID-19 Cases Who Fully Recovered: (\d+)/;
      const cases = parse.number(regexCases.exec($span[0].children[0].data)[1]);
      const recovered = parse.number(regexRecovered.exec($span[0].children[2].data)[1]);
      return {
        cases,
        recovered
      };
    },
    '2020-3-26': async function() {
      return {
        cases: 67,
        recovered: 4,
        deaths: 0
      };
    },
    '2020-3-27': async function() {
      this.url = await fetch.getArcGISCSVURL('', 'a54a945cac82424fa4928139ee83f911', 'Cases_current');
      this.type = 'csv';

      const data = await fetch.csv(this.url);
      for (const row of data) {
        return {
          cases: parse.number(row.confirmed),
          deaths: parse.number(row.deaths),
          recovered: parse.number(row.recovered),
          active: parse.number(row.active)
        };
      }
    }
  }
};

export default scraper;
