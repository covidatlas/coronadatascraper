import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Fresno County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  url: 'https://www.co.fresno.ca.us/departments/public-health/covid-19',
  maintainers: [maintainers.jbencina],
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    return {
      cases: parse.number(
        $('li:contains("Total cases")')
          .children()
          .remove()
          .end()
          .text()
      ),
      deaths: parse.number($('li:contains("Total deaths")').text())
    };
  }
};

export default scraper;
