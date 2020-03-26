import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'Victoria State Government Health and Human Services Department',
      name: 'Victoria State Government Health and Human Services',
      url: 'https://www.dhhs.vic.gov.au'
    }
  ],
  state: 'Victoria',
  type: 'paragraph',
  url: 'https://www.dhhs.vic.gov.au/media-hub-coronavirus-disease-covid-19',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $anchor = $('.content ul li a:contains("Department of Health and Human Services media release - ")');
      const currentArticleUrl = $anchor.attr('href');
      const $currentArticlePage = await fetch.page(`https://www.dhhs.vic.gov.au${currentArticleUrl}`);
      const paragraph = $currentArticlePage('.page-content p:first-of-type').text();
      const { casesString } = paragraph.match(/cases in Victoria \w* (?<casesString>\d+)./).groups;
      return {
        cases: parse.number(casesString)
      };
    },
    '2020-2-25': async function() {
      return {
        cases: 466
      };
    }
  }
};

export default scraper;
