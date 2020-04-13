import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';

const reformatDate = date => `20${date.substring(6, 8)}-${date.substring(3, 5)}-${date.substring(0, 2)}`;

const scraper = {
  country: 'iso1:CY',
  url: 'https://www.data.gov.cy/sites/default/files/CY%20Covid19%20Daily%20Statistics_6.csv',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [
    {
      description: 'Official website for Cyprus Open Data',
      url: 'https://data.gov.cy/',
      name: 'data.gov.cy'
    }
  ],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesData = (await fetch.csv(this.url, false)).filter(item => datetime.scrapeDateIs(reformatDate(item.date)));

    if (casesData.length > 0) {
      const data = {};

      for (const item of casesData) {
        if (datetime.dateIsBeforeOrEqualTo(reformatDate(item.date), date)) {
          data.cases = parse.number(item['total cases']);
          data.tested = parse.number(item['total tests']);
          data.recovered = parse.number(item['total recovered']);
          data.deaths = parse.number(item['total deaths']);
        }
      }

      return data;
    }
  }
};

export default scraper;
