import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Colusa County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  url: 'http://www.countyofcolusa.org/99/Public-Health',
  maintainers: [maintainers.jbencina],
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    const cases = parse.number(
      $('strong:contains("Confirmed Cases:")')
        .first()
        .text()
        .match(/Confirmed Cases: (\d+)/)[1]
    );
    return { cases };
  }
};

export default scraper;
