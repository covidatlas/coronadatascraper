import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'AUS',
  maintainer: maintainers.camjc,
  priority: 2,
  sources: {
    description: 'QLD Government Health Department',
    name: 'QLD Government Health',
    url: 'https://www.health.qld.gov.au'
  },
  state: 'Queensland',
  type: 'paragraph',
  url: 'https://www.health.qld.gov.au/news-events/doh-media-releases',
  async scraper() {
    const $ = await fetch.page(this.url);
    const anchors = $('#content h3:first-of-type > a');
    const currentArticleUrl = anchors[0].attribs.href;
    const $currentArticlePage = await fetch.page(currentArticleUrl);
    const paragraph = $currentArticlePage('#content h2:first-of-type + p').text();
    const { casesString } = paragraph.match(/state total to (?<casesString>\d+)./).groups;
    return {
      state: scraper.state,
      cases: parse.number(casesString)
    };
  }
};

export default scraper;
