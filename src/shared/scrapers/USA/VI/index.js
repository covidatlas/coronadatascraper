import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

const scraper = {
  state: 'VI',
  country: 'USA', // The alpha-3 country code is VIR
  type: 'list',
  sources: [
    {
      url: 'https://doh.vi.gov/',
      name: 'VIDOH',
      description: 'United States Virgin Islands Department of Health'
    }
  ],
  url: 'https://doh.vi.gov/covid19usvi',
  async scraper() {
    const $ = await fetch.page(this.url);
    const matchedLines = $('#page-content-sidebar > div.widget > div.title-box')
      .first()
      .next()
      .children('p')
      .map(function() {
        return $(this).text();
      })
      .get();

    const data = matchedLines
      .map(text => text.split(':', 2))
      .map(([l, r]) => [l.trim().toLowerCase(), r.trim()])
      .reduce((acc, [key, val]) => acc.set(key.toLowerCase(), val), new Map());

    if (data.size < 1) throw new Error(`Failed to parse data for ${this.country}-${this.state}`);
    const positive = parse.number(data.get('positive'));
    const negative = parse.number(data.get('negative'));
    const pending = parse.number(data.get('pending'));
    const totalTested = positive + negative + pending;

    // Date format: "Sunday, March 29, 2020 7:00 pm"
    // const lastUpdated = data.get('last updated');

    const stats = {
      cases: positive,
      tested: totalTested
    };

    // Need to wrap this in an array or else the test fails
    return [stats];
  }
};

export default scraper;
