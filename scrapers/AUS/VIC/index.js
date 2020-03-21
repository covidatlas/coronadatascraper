import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';

const scraper = {
  country: 'AUS',
  state: 'Victoria',
  url: 'https://www.dhhs.vic.gov.au/media-hub-coronavirus-disease-covid-19',
  type: 'paragraph',
  priority: 1,
  async scraper() {
    const $ = await fetch.page(this.url);
    const anchors = $('.content ul li a');
    const currentArticleUrl = anchors[0].attribs.href;
    const $currentArticlePage = await fetch.page(`https://www.dhhs.vic.gov.au${currentArticleUrl}`);
    const paragraph = $currentArticlePage('.page-content p:first-of-type').text();
    const { casesString } = paragraph.match(/cases in Victoria to (?<casesString>\d+)./).groups;
    const cases = parse.number(casesString);
    return { state: scraper.state, cases };
  }
};

export default scraper;
