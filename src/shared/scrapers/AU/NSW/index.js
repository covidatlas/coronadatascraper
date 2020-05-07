import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import getDataWithTestedNegativeApplied from '../../../utils/get-data-with-tested-negative-applied.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../lib/maintainers.js';

const schemaKeysByHeadingFragment = {
  deaths: 'deaths',
  'confirmed case': 'cases',
  'tested and excluded': 'testedNegative',
  recovered: 'recovered'
};

const getDeathsFromParagraph = $currentArticlePage => {
  const paragraph = $currentArticlePage('p:contains("deaths")').text();
  const matches = paragraph.match(/been (?<casesString>[\d,]+) deaths/) || {};
  const { casesString } = matches.groups || {};
  if (casesString && parse.number(casesString) > 0) {
    return parse.number(casesString);
  }
  return undefined;
};

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'NSW Government Health Department',
      name: 'NSW Government Health',
      url: 'https://www.health.nsw.gov.au'
    }
  ],
  state: 'iso2:AU-NSW',
  type: 'table',
  url:
    'https://www.health.nsw.gov.au/_layouts/feed.aspx?xsl=1&web=/news&page=4ac47e14-04a9-4016-b501-65a23280e841&wp=baabf81e-a904-44f1-8d59-5f6d56519965&pageurl=/news/Pages/rss-nsw-health.aspx',
  async scraper() {
    const $ = await fetch.page(this, this.url, 'tmpindex');
    const $anchors = $('channel > item:contains("statistics") > link');
    const currentArticleUrl = $anchors[0].next.data;
    const $currentArticlePage = await fetch.page(this, currentArticleUrl, 'default');

    const $table = $currentArticlePage('.maincontent table:first-of-type');
    const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');
    const data = {};
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const key = getSchemaKeyFromHeading({
        heading: parse.string($tr.find('*:first-child').text()).replace('(in NSW from confirmed cases)', ''),
        schemaKeysByHeadingFragment
      });
      if (key) {
        data[key] = parse.number($tr.find('*:last-child').text());
      }
    });
    assert(data.cases > 0, 'Cases is not reasonable');
    data.deaths = data.deaths || getDeathsFromParagraph($currentArticlePage);
    return getDataWithTestedNegativeApplied(data);
  }
};

export default scraper;
