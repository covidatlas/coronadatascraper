import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'iso1:EE',
  url: 'https://opendata.digilugu.ee/opendata_covid19_test_results.json',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const testedData = await fetch.json(this.url, false);

    console.log(testedData);
  }
};

export default scraper;
