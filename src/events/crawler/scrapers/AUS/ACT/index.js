import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'AUS',
  maintainer: maintainers.camjc,
  priority: 2,
  sources: [
    {
      description: 'ACT Government Health Department',
      name: 'ACT Government Health',
      url: 'https://www.health.act.gov.au'
    }
  ],
  state: 'Australian Capital Territory',
  type: 'table',
  url: 'https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('.statuscontent');
    const $rowWithCases = $table.find('div:first-child').text();
    return {
      state: scraper.state,
      cases: parse.number($rowWithCases)
    };
  }
};

export default scraper;
