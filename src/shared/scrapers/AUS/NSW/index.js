import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

/**
 * @param {Cheerio} $row
 */
const parseRow = $row => parse.number($row.find('td:last-child').text());

const scraper = {
  country: 'AUS',
  maintainer: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'NSW Government Health Department',
      name: 'NSW Government Health',
      url: 'https://www.health.nsw.gov.au'
    }
  ],
  state: 'New South Wales',
  type: 'table',
  url:
    'https://www.health.nsw.gov.au/_layouts/feed.aspx?xsl=1&web=/news&page=4ac47e14-04a9-4016-b501-65a23280e841&wp=baabf81e-a904-44f1-8d59-5f6d56519965&pageurl=/news/Pages/rss-nsw-health.aspx',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const anchors = $('channel > item > link');
      const currentArticleUrl = anchors[0].next.data;
      const $currentArticlePage = await fetch.page(currentArticleUrl);
      const $table = $currentArticlePage('.maincontent table:first-of-type');

      return {
        state: scraper.state,
        cases: parseRow($table.find('tbody > tr:nth-child(2)')),
        tested: parseRow($table.find('tbody > tr:last-child'))
      };
    },
    '2020-3-28': async function() {
      await fetch.page(this.url);
      throw new DeprecatedError('NSW page seems to be broken');
    }
  }
};

export default scraper;
