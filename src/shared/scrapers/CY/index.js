import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';

const reformatDate = date => `20${date.substring(6, 8)}-${date.substring(3, 5)}-${date.substring(0, 2)}`;

const scraper = {
  country: 'iso1:CY',
  url: 'https://data.gov.cy/api/3/action/package_show?id=f6c70a36-daaf-42c2-80d6-f99a329fdd0f',
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
  scraper: {
    '0': async function scraper() {
      const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);
      const datasetRaw = await fetch.json(this, this.url, 'tmpindex', false);
      const dataset = datasetRaw.result[0].resources.find(item => item.format === 'csv');

      const casesRaw = await fetch.csv(this, dataset.url, 'default', false);
      const casesData = casesRaw.filter(item => {
        return datetime.scrapeDateIs(reformatDate(item.date));
      });

      const data = {};
      if (casesData.length > 0) {
        for (const item of casesData) {
          if (datetime.dateIsBeforeOrEqualTo(reformatDate(item.date), date)) {
            data.cases = parse.number(item['total cases']);
            data.tested = parse.number(item['total tests']);
            data.recovered = parse.number(item['total recovered']);
            data.deaths = parse.number(item['total deaths']);
          }
        }
      }
      return data;
    },
    '2020-04-14': async function scraper() {
      this.url = 'https://data.gov.cy/sites/default/files/CY%20Covid19%20Daily%20Statistics_25.csv';
      const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);
      const casesRaw = await fetch.csv(this, this.url, 'default', false);
      const casesData = casesRaw.filter(item => datetime.scrapeDateIs(reformatDate(item.date)));
      const data = {};
      if (casesData.length > 0) {
        for (const item of casesData) {
          if (datetime.dateIsBeforeOrEqualTo(reformatDate(item.date), date)) {
            data.cases = parse.number(item['total cases']);
            data.tested = parse.number(item['total tests']);
            data.recovered = parse.number(item['total recovered']);
            data.deaths = parse.number(item['total deaths']);
          }
        }
      }
      return data;
    }
  }
};

export default scraper;
