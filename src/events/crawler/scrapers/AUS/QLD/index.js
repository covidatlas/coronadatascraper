import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'QLD Government Health Department',
      name: 'QLD Government Health',
      url: 'https://www.health.qld.gov.au'
    }
  ],
  state: 'Queensland',
  type: 'paragraph',
  url: 'https://www.health.qld.gov.au/news-events/doh-media-releases',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const anchors = $('#content h3:first-of-type > a');
      const currentArticleUrl = anchors[0].attribs.href;
      const $currentArticlePage = await fetch.page(currentArticleUrl);
      const paragraph = $currentArticlePage('#content h2:first-of-type + p').text();
      const paragraphWithoutNbsp = paragraph.replace(/\u00a0/g, ' ');
      const { casesString } = paragraphWithoutNbsp.match(/state total to (?<casesString>\d+)./).groups;
      return {
        cases: parse.number(casesString)
      };
    },
    '2020-3-25': function() {
      // Hardcoded cause ain't nobody got time for that
      return {
        cases: 25
      };
    }
  }
};

export default scraper;
