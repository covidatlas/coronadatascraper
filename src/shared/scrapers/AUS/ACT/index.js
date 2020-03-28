import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';

const getKey = rowLabel => {
  const lowerLabel = rowLabel.toLowerCase();
  if (lowerLabel.includes('confirmed case')) {
    return 'cases';
  }
  if (lowerLabel.includes('tested negative')) {
    return 'tested';
  }
  if (lowerLabel.includes('recovered')) {
    return 'recovered';
  }
  throw new Error(`There is a row we are not expecting: ${lowerLabel}`);
};

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'ACT Government Health Department',
      name: 'ACT Government Health',
      url: 'https://www.health.act.gov.au'
    }
  ],
  state: 'Australian Capital Territory',
  type: 'table',
  url: 'https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('.statuscontent');
    const $trs = $table.find('div');
    const data = {
      deaths: 0,
      recovered: 0,
      state: scraper.state
    };
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const [label, value] = $tr.text().split(': ');
      const key = getKey(label);
      data[key] = parse.number(value);
    });
    if (data.tested > 0) {
      data.tested += data.cases; // `tested` is only tested negative in this table, add the positive tested.
    }
    return data;
  }
};

export default scraper;
