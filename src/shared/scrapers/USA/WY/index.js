import cheerio from 'cheerio';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import maintainers from '../../../lib/maintainers.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';
const scraper = {
  state: 'WY',
  country: 'USA',
  aggregate: 'county',
  sources: [
    {
      url: 'https://health.wyo.gov/publichealth',
      name: 'Wyoming Department of Health',
      description: 'Public Health Division'
    }
  ],
  url: 'https://health.wyo.gov/publichealth/infectious-disease-epidemiology-unit/disease/novel-coronavirus/',
  type: 'paragraph',
  maintainers: [maintainers.lazd],
  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    const $p = $('strong:contains("Cases by County")').parent();

    const items = $p.html().split('<br>');

    for (const item of items) {
      const $item = cheerio.load(item);

      const pieces = $item.text().split(':');
      const county = pieces[0];
      let count = pieces[1];

      if (county === 'Cases by County') {
        continue;
      }
      if (count === undefined) {
        count = 0;
      } else {
        count = parse.number(parse.string(count) || 0);
      }
      counties.push({
        county: geography.addCounty(parse.string(county)),
        cases: count
      });
    }

    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
