import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'Nothern Territory Government Coronavirus site',
      name: 'Nothern Territory Government Coronavirus site',
      url: 'https://coronavirus.nt.gov.au'
    }
  ],
  state: 'Northern Territory',
  type: 'table',
  url: 'https://coronavirus.nt.gov.au/',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $rowWithCases = $('.header-widget p:first-of-type');
    return {
      state: scraper.state,
      cases: parse.number($rowWithCases.text())
    };
  }
};

export default scraper;
