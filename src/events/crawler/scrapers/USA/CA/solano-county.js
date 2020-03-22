import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Solano County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'http://www.solanocounty.com/depts/ph/coronavirus.asp',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $el = $('*:contains("Number of Positive Cases")').first();
    const matches = $el.text().match(/Number of Positive Cases in Solano County: (\d+)/);
    return { cases: parse.number(matches[1]) };
  }
};

export default scraper;
