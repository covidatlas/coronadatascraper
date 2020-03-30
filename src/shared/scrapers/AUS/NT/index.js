import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'Northern Territory Government Coronavirus site',
      name: 'Northern Territory Government Coronavirus site',
      url: 'https://coronavirus.nt.gov.au'
    }
  ],
  state: 'Northern Territory',
  type: 'table',
  url: 'https://coronavirus.nt.gov.au/',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $rowWithCases = $('.header-widget p:first-of-type');
    assert($rowWithCases.text().includes('confirmed cases'));
    const data = {
      state: this.state,
      cases: parse.number($rowWithCases.text())
    };
    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
