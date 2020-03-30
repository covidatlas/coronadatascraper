import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Changing free-text media release.
// They have a PowerBI dashboard at https://app.powerbi.com/view?r=eyJrIjoiODBmMmE3NWQtZWNlNC00OWRkLTk1NjYtMjM2YTY1MjI2NzdjIiwidCI6ImMwZTA2MDFmLTBmYWMtNDQ5Yy05Yzg4LWExMDRjNGViOWYyOCJ9
// No idea how to get the data out of that though.
// We've emailed them on 2020-03-28 to try to get a usable format.
// For now lets fall back to the AUS index scraper when we can't scrape successfully.

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
  async scraper() {
    const $ = await fetch.page(this.url);
    const $anchor = $('.content ul li a:contains("Department of Health and Human Services media release - ")');
    const currentArticleUrl = $anchor.attr('href');
    const $currentArticlePage = await fetch.page(`https://www.dhhs.vic.gov.au${currentArticleUrl}`);
    const paragraph = $currentArticlePage('.page-content p:first-of-type').text();
    const matches = paragraph.match(/cases in Victoria \w* (?<casesString>\d+)/) || {};
    const { casesString } = matches.groups || {};
    const data = {
      state: this.state,
      cases: parse.number(casesString)
    };

    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
