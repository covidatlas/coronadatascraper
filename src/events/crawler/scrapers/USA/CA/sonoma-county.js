import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Sonoma County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://socoemergency.org/emergency/novel-coronavirus/novel-coronavirus-in-sonoma-county/',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $th = $('th:contains("Total in Sonoma County")');
    const $table = $th.closest('table');
    const $td = $table.find('td:last-child');
    const cases = parse.number($td.text());
    return { cases };
  }
};

export default scraper;
