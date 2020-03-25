import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Clark County',
  state: 'NV',
  country: 'USA',
  url: 'https://www.southernnevadahealthdistrict.org/coronavirus',
  sources: [
    {
      name: 'Southern Nevada Health District',
      url: 'https://www.southernnevadahealthdistrict.org',
      description: 'Southern Nevada health department'
    }
  ],
  type: 'table',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $h1 = $('h1:contains("Total Cases:")');
    const regexCases = /Total Cases: (\d+)/;
    const cases = parse.number(regexCases.exec($h1[0].children[0].data)[1]);
    const $td = $('td:contains("Deaths")').next();
    const deaths = parse.number($td[0].children[0].data);
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
