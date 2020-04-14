import sync from 'csv-parse/lib/sync';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

const scraper = {
  country: 'iso1:US',
  state: 'iso2:US-KY',
  priority: 1,
  aggregate: 'county',
  url: 'https://datawrapper.dwcdn.net/BbowM/23/',
  sources: [
    {
      name: 'Kentucky Cabinet for Health and Family Services',
      url: 'https://www.kentucky.com/news/coronavirus/article241309406.html'
    }
  ],
  maintainers: [
    {
      name: 'Jordan Holt',
      email: 'jordholt@gmail.com',
      github: 'Jord-Holt',
      country: 'iso1:US',
      flag: '🇺🇸'
    }
  ],
  async scraper() {
    const $ = await fetch.headless(this.url);

    const counties = [];

    // Extract raw csv from link attribute on Kentucky Health Organizations data map.
    const csvText = decodeURIComponent($('a[class="dw-data-link"]').attr('href')).replace(
      'data:application/octet-stream;charset=utf-8,',
      ''
    );

    // Parse csv.
    const data = sync(csvText, { columns: true });

    // Construct counties list and return to system.
    for (const county of data) {
      counties.push({
        county: geography.addCounty(county.County),
        cases: county.Total === 'null' ? 0 : parse.number(county.Total),
        deaths: county.Deaths === 'null' ? 0 : parse.number(county.Deaths),
        recovered: county.Recovered === 'null' ? 0 : parse.number(county.Recovered)
      });
    }

    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
