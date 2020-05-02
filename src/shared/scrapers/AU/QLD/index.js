import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../lib/maintainers.js';

const schemaKeysByHeadingFragment = {
  deaths: 'deaths',
  'cases to date': 'cases', // Cases had this label between 2020-04-09 and 2020-04-11
  'recovered cases': 'recovered',
  hhs: null,
  active: null // Active will be calculated.
};

async function getCurrentArticlePage(obj) {
  const $ = await fetch.page(obj, obj.url, 'tempindex');
  const anchors = $('#content h3:contains("update") > a');
  const currentArticleUrl = anchors[0].attribs.href;
  return fetch.page(obj, currentArticleUrl, 'default');
}

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'QLD Government Health Department',
      name: 'QLD Government Health',
      url: 'https://www.health.qld.gov.au'
    }
  ],
  state: 'iso2:AU-QLD',
  type: 'table',
  url: 'https://www.health.qld.gov.au/news-events/doh-media-releases',
  scraper: {
    '0': async function() {
      const $ = await getCurrentArticlePage(this);
      const paragraph = $('#content h2:first-of-type + p').text();
      const { casesString } = paragraph.match(/state total to (?<casesString>\d+)./).groups;
      this.type = 'paragraph';
      return {
        cases: parse.number(casesString)
      };
    },
    '2020-03-24': async function() {
      const $ = await getCurrentArticlePage(this);
      const $table = $('#content table');
      const $totalRow = $table.find('tbody > tr:last-child');
      const data = {
        cases: parse.number($totalRow.find('td:last-child').text())
      };
      assert(data.cases > 0, 'Cases is not reasonable');
      return data;
    },
    '2020-04-09': async function() {
      const $ = await getCurrentArticlePage(this);
      const $table = $('#content table');

      const $headings = $table.find('tbody:first-child tr th, thead:first-child tr th');
      const $totals = $table.find('tbody:last-child tr:last-of-type > *');
      assert.equal($headings.length, $headings.length, 'headings and totals are misaligned');

      const data = {};
      $headings.each((index, heading) => {
        const $heading = $(heading);
        const $total = $($totals[index]);
        const key = getSchemaKeyFromHeading({ heading: $heading.text(), schemaKeysByHeadingFragment });
        if (key) {
          data[key] = parse.number($total.text());
        }
      });
      assert(data.cases > 0, 'Cases is not reasonable');
      return data;
    }
  }
};

export default scraper;
