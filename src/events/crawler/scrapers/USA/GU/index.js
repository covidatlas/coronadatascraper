import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'Guam',
  country: 'USA',
  url: 'http://dphss.guam.gov/2019-novel-coronavirus-2019-n-cov/',
  sources: [
    {
      name: 'Department of Public Health and Social Services',
      url: 'http://dphss.guam.gov',
      description: 'Guam health department'
    }
  ],
  type: 'table',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $h2Cases = $('h2:contains("Confirmed Positives")');
    const $h2Deaths = $('h2:contains("Number of Deaths")');
    const cases = parse.number($h2Cases[0].parent.children[5].children[0].data);
    const deaths = parse.number($h2Deaths[0].parent.children[5].children[0].data);
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
