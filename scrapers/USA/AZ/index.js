import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'AZ',
  country: 'USA',
  url: 'https://tableau.azdhs.gov/views/COVID-19Dashboard/COVID-19table.csv?%3AisGuestRedirectFromVizportal=y&%3Aembed=y',
  type: 'csv',
  async scraper() {
    let cases = 0;
    let deaths = 0;

    const data = await fetch.csv(this.url);
    for (const row of data) {
      if (row.Category === 'Total Cases') {
        cases += parse.number(row.Positive);
      } else if (row.Category === 'Total Deaths') {
        deaths += parse.number(row.Positive);
      }
    }

    return { cases, deaths };
  }
};

export default scraper;
