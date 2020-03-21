import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';

const scraper = {
  country: 'AUS',
  state: 'Queensland',
  url: 'https://www.health.qld.gov.au/news-events/doh-media-releases',
  type: 'paragraph',
  priority: 1,
  async scraper() {
    const $ = await fetch.page(this.url);
    const anchors = $('#content h3:first-of-type > a');
    const currentArticleUrl = anchors[0].attribs.href;
    const $currentArticlePage = await fetch.page(currentArticleUrl);
    const paragraph = $currentArticlePage('#content h2:first-of-type + p').text();
    const { casesString } = paragraph.match(/state total to (?<casesString>\d+)./).groups;
    const cases = parse.number(casesString);
    return { state: scraper.state, cases };
  }
};

export default scraper;
