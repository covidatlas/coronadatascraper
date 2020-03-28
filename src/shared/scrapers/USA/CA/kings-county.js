import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Kings County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url:
    'https://www.countyofkings.com/departments/health-welfare/public-health/coronavirus-disease-2019-covid-19/-fsiteid-1',
  async scraper() {
    const $ = await fetch.page(this.url);
    const cases = parse.number(
      $('h3:contains("Confirmed Cases")')
        .text()
        .match(/Confirmed Cases: (\d+)/)[1]
    );
    return { cases };
  }
};

export default scraper;
