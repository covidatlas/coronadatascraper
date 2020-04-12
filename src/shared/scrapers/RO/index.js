import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'iso1:RO',
  url: 'https://covid19.geo-spatial.org/',
  timeseries: true,
  priority: 1,
  type: 'json',
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const casesData = await fetch.json('https://covid19.geo-spatial.org/api/dashboard/getCasesByCounty');
    const daily = await fetch.json('https://covid19.geo-spatial.org/api/dashboard/getDailyCaseReport');
    const daily2 = await fetch.json('https://covid19.geo-spatial.org/api/dashboard/getDailyCases');

    console.log(casesData);
  }
};

export default scraper;
