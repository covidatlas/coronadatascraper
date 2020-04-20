import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      name: 'Northern Territory Government - Coronavirus site',
      url: 'https://coronavirus.nt.gov.au'
    }
  ],
  state: 'iso2:AU-NT',
  type: 'table',
  url: 'https://coronavirus.nt.gov.au/',
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    const $rowWithCases = $('.header-widget p:first-of-type');
    assert($rowWithCases.text().includes('confirmed cases'));
    const data = {
      cases: parse.number($rowWithCases.text())
    };
    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
