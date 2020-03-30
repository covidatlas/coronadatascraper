import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';

const scraper = {
  country: 'VIR',
  type: 'table',
  url: 'https://doh.vi.gov/covid19usvi',
  sources: [
    {
      url: 'https://doh.vi.gov',
      name: 'United States Virgin Islands Department of Health'
    }
  ],
  maintainers: [
    {
      name: 'Jacob McGowan',
      github: 'jacobmcgowan'
    }
  ],
  async scraper() {
    const results = {
      cases: 0,
      tested: 0,
      deaths: 0
    };
    const $ = await fetch.page(this.url);
    const $widget = $('div.widget:has(div.title-box:has(h1:contains(COVID-19 Cases)))');
    const $paragraphs = $widget.find('div.block-content > p');

    $paragraphs.each((index, paragraph) => {
      const text = $(paragraph)
        .text()
        .toLowerCase();
      const separatorIndex = text.indexOf(':');
      const heading = text.substring(0, separatorIndex);
      const value = text.substring(separatorIndex + 1);

      switch (heading) {
        case 'positive':
          results.cases = parse.number(value);
          results.tested += results.cases;
          break;
        case 'negative':
          results.tested += parse.number(value);
          break;
        // There have been no deaths at the time of writing so different word
        // choices are being used to better prepare to scrape these numbers.
        case 'deaths':
          results.deaths = parse.number(value);
          break;
        case 'dead':
          results.deaths = parse.number(value);
          break;
        default:
          break;
      }
    });

    return results;
  }
};

export default scraper;
