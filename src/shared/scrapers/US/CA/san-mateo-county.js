import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Mateo County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.smchealth.org/coronavirus',
  async scraper() {
    let deaths;
    let cases;
    const $ = await fetch.page(this, this.url, 'default');
    const $th = $('th:contains("COVID-19 Case Count")');
    const $table = $th.closest('table');
    {
      const $tr = $table.find('*:contains("Positive")').closest('tr');
      const $dataTd = $tr.find('td:last-child');
      cases = parse.number($dataTd.text());
    }
    {
      const $tr = $table.find('*:contains("Deaths")').closest('tr');
      const $dataTd = $tr.find('td:last-child');
      deaths = parse.number($dataTd.text());
    }
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
