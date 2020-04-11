import assert from 'assert';

import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import maintainers from '../../lib/maintainers.js';
import datetime from '../../lib/datetime/index.js';

const scraper = {
  country: 'iso1:ZA',
  url:
    'https://raw.githubusercontent.com/dsfsi/covid19za/master/data/covid19za_provincial_cumulative_timeline_confirmed.csv',
  timeseries: true,
  priority: 1,
  type: 'csv',
  sources: [],
  maintainers: [maintainers.qgolsteyn],
  _province: ['EC', 'FS', 'GP', 'KZN', 'LP', 'MP', 'NC', 'NW', 'WC'],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesData = await fetch.csv(this.url, false);
    const todayData = casesData.find(
      item =>
        datetime.parse(
          `${item.YYYYMMDD.substring(0, 4)}-${item.YYYYMMDD.substring(4, 6)}-${item.YYYYMMDD.substring(6, 8)}`
        ) === datetime.parse(date)
    );

    if (todayData) {
      const data = [];
      for (const col of Object.keys(todayData)) {
        if (this._province.findIndex(item => item === col) > 0) {
          data.push({
            state: `iso2:ZA-${col}`,
            cases: parse.number(todayData[col])
          });
        } else if (col === 'total') {
          data.push({
            cases: parse.number(todayData[col])
          });
        }
      }

      assert(data.length === 9, 'Missing province data');

      return data;
    }
    throw new Error('No data available for today');
  }
};

export default scraper;
