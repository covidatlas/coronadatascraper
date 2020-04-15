import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Clark County',
  state: 'iso2:US-NV',
  country: 'iso1:US',
  url: 'https://www.southernnevadahealthdistrict.org/coronavirus',
  sources: [
    {
      name: 'Southern Nevada Health District',
      url: 'https://www.southernnevadahealthdistrict.org',
      description: 'Southern Nevada health department'
    }
  ],
  type: 'table',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $h1 = $('h1:contains("Total Cases:")');
      const regexCases = /Total Cases: (\d+)/;
      const cases = parse.number(regexCases.exec($h1[0].children[0].data)[1]);
      const $td = $('td:contains("Deaths")').next();
      const deaths = parse.number($td[0].children[0].data);
      return {
        cases,
        deaths
      };
    },
    '2020-03-25': async function() {
      const $ = await fetch.page(this, this.url, 'default');

      const casesText = $('*:contains("Total Cases:")').text();
      const regexCases = /Total Cases: (\d+)/;
      const cases = parse.number(regexCases.exec(casesText)[1]);

      const deathsText = $('*:contains("Total Deaths:")').text();
      const regexDeaths = /Total Deaths: (\d+)/;
      const deaths = parse.number(regexDeaths.exec(deathsText)[1]);

      return {
        cases,
        deaths
      };
    }
  }
};

export default scraper;
