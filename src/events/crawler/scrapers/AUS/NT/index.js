import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';

const scraper = {
  country: 'AUS',
  state: 'Northern Territory',
  url: 'https://coronavirus.nt.gov.au/',
  type: 'table',
  priority: 1,
  async scraper() {
    const $ = await fetch.page(this.url);
    const $rowWithCases = $('.header-widget p:first-of-type');
    return [{ state: scraper.state, cases: parse.number($rowWithCases.text()) }];
  }
};

export default scraper;
