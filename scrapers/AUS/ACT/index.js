import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';

const scraper = {
  country: 'AUS',
  state: 'ACT',
  url: 'https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19',
  type: 'table',
  priority: 1,
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('.statuscontent');
    const $rowWithCases = $table.find('div:first-child').text();
    return [{ state: 'ACT', cases: parse.number($rowWithCases) }];
  }
};

export default scraper;
