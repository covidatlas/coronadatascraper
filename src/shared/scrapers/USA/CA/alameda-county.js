import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Alameda County',
  state: 'CA',
  country: 'USA',
  sources: [
    {
      url: 'http://www.acphd.org',
      name: 'Alameda County Public Health Department'
    }
  ],
  url: 'http://www.acphd.org/2019-ncov.aspx',
  headless: true,
  type: 'paragraph',
  maintainers: [maintainers.jbencina],
  async scraper() {
    const $ = await fetch.headless(this.url);
    const $el = $('p:contains("Positive Cases")');
    const matches = $el.html().match(/Positive Cases:.*?(\d+).*/);
    return { cases: parse.number(matches[1]) };
  }
};

export default scraper;
