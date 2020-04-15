import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Francisco County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.sfdph.org/dph/alerts/coronavirus.asp',
  type: 'paragraph',
  async scraper() {
    let deaths;
    let cases;
    const $ = await fetch.page(this, this.url, 'default');
    const $h2 = $('h2:contains("Cases in San Francisco")');
    {
      const $p = $h2.nextAll('*:contains("Cases:")');
      cases = parse.number($p.text());
    }
    {
      const $p = $h2.nextAll('*:contains("Deaths:")');
      deaths = parse.number($p.text());
    }
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
