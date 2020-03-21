import * as fetch from '../../../lib/fetch.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

const scraper = {
  country: 'USA',
  state: 'KY',
  priority: 1,
  url: 'https://datawrapper.dwcdn.net/BbowM/23/',
  aggregate: 'county',
  async scraper() {
    const $ = await fetch.headless(this.url);

    const counties = [];
    const jsonList = [];

    // Extract raw csv from link attribute on Kentucky Health Organizations data map.
    const $rawCSVstring = decodeURIComponent($('a[class="dw-data-link"]').attr('href')).replace('data:application/octet-stream;charset=utf-8,', '');

    // Convert this string into something more manageable (json)
    const lines = $rawCSVstring.split('\n');
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const obj = {};
      const currentline = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      jsonList.push(obj);
    }

    // Construct counties list and return to system.
    for (const county of jsonList) {
      counties.push({
        county: geography.addCounty(county.County),
        cases: county.Total === 'null' ? 0 : parseInt(county.Total, 10),
        deaths: county.Deaths === 'null' ? 0 : parseInt(county.Deaths, 10),
        recovered: county.Recovered === 'null' ? 0 : parseInt(county.Recovered, 10)
      });
    }

    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
