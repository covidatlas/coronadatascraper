import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Changing free-text media release.
// They have a PowerBI dashboard at https://app.powerbi.com/view?r=eyJrIjoiODBmMmE3NWQtZWNlNC00OWRkLTk1NjYtMjM2YTY1MjI2NzdjIiwidCI6ImMwZTA2MDFmLTBmYWMtNDQ5Yy05Yzg4LWExMDRjNGViOWYyOCJ9
// https://github.com/vungyn/vic-covid-19 has managed to scrape it.
// We've emailed them on 2020-03-28 to try to get a more usable format.
// For now lets fall back to the AUS index scraper when we can't scrape successfully.

const makeAbsoluteUrl = currentArticleHref => {
  if (currentArticleHref.startsWith('/')) {
    return `https://www.dhhs.vic.gov.au${currentArticleHref}`;
  }
  return currentArticleHref;
};

const buildParagraphMatcher = ({ $ }) => ({ selector, regex }) => {
  const paragraph = $(selector).text();
  const matches = paragraph.match(regex) || {};
  const { dataPoint } = matches.groups || {};
  return dataPoint ? parse.number(dataPoint) : undefined;
};

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'Victoria State Government Health and Human Services Department',
      name: 'Victoria State Government Health and Human Services',
      url: 'https://www.dhhs.vic.gov.au'
    }
  ],
  state: 'iso2:AU-VIC',
  type: 'paragraph',
  url: 'https://www.dhhs.vic.gov.au/media-hub-coronavirus-disease-covid-19',
  async scraper() {
    const $listPage = await fetch.page(this, this.url, 'tmpindex');
    const $anchor = $listPage('.content ul li a:contains("Department of Health and Human Services media release - ")');
    const currentArticleHref = $anchor.attr('href');
    const url = makeAbsoluteUrl(currentArticleHref);
    const $ = await fetch.page(this, url, 'default');

    const paragraphMatcher = buildParagraphMatcher({ $ });
    const data = {
      cases: paragraphMatcher({
        selector: `.page-content p:contains("cases in Victoria")`,
        regex: /cases in Victoria \w* (?<dataPoint>[\d,]+)/
      }),
      deaths: paragraphMatcher({
        selector: `.page-content p:contains("people have died")`,
        regex: /To date, (?<dataPoint>[\d,]+) people have died/
      }),
      recovered: paragraphMatcher({
        selector: `.page-content p:contains("people have recovered")`,
        regex: /(?<dataPoint>[\d,]+) people have recovered/
      }),
      tested: paragraphMatcher({
        selector: `.page-content p:contains("More than")`,
        regex: /More than (?<dataPoint>[\d,]+) test/
      })
    };

    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
