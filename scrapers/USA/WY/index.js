import cheerio from 'cheerio';
import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import maintainers from '../../../lib/maintainers.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';
const scraper = {
  state: 'WY',
  country: 'USA',
  aggregate: 'county',
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
      const [county, count] = $item.text().split(':');
      if (county === 'Cases by County') {
        continue;
      }
      counties.push({
        county: geography.addCounty(parse.string(county)),
        cases: parse.number(count || 0)
      });
    }

    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
