import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import maintainers from '../../../lib/maintainers.js';

async function getCurrentArticlePage(listUrl) {
  const $ = await fetch.page(listUrl);
  const anchors = $('#content h3:first-of-type > a');
  const currentArticleUrl = anchors[0].attribs.href;
  return fetch.page(currentArticleUrl);
}

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
      const $ = await getCurrentArticlePage(this.url);
      const paragraph = $('#content h2:first-of-type + p').text();
      const { casesString } = paragraph.match(/state total to (?<casesString>\d+)./).groups;
      return {
        state: scraper.state,
        cases: parse.number(casesString)
      };
    },
    '2020-3-24': async function() {
      const HHSs = []; // See https://www.health.qld.gov.au/maps
      const $ = await getCurrentArticlePage(this.url);
      const $table = $('#content table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const cases = parse.number($tr.find('td:last-child').text());
        const county = parse.string($tr.find('td:first-child').text());
        HHSs.push({
          county,
          cases
        });
      });
      const total = transform.sumData(HHSs);
      HHSs.push(total);
      return HHSs;
    }
  }
};

export default scraper;
