import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';

const getKey = rowLabel => {
  const lowerLabel = rowLabel.toLowerCase();
  if (lowerLabel.includes('confirmed cases')) {
    return 'cases';
  }
  if (lowerLabel.includes('total')) {
    return 'tested';
  }
  if (lowerLabel.includes('tested and excluded')) {
    return 'discard';
  }
  throw new Error(`unknown row: ${lowerLabel}`);
};

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
  async scraper() {
    const $ = await fetch.page(this.url);
    const $anchors = $('channel > item:contains("statistics") > link');
    const currentArticleUrl = $anchors[0].next.data;
    const $currentArticlePage = await fetch.page(currentArticleUrl);

    const $table = $currentArticlePage('.maincontent table:first-of-type');
    const $trs = $table.find('tbody > tr:not(:first-child)');
    const data = { state: this.state };
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const key = getKey($tr.find('td:first-child').text());
      data[key] = parse.number($tr.find('td:last-child').text());
    });
    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
