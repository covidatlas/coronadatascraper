import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';
import datetime from '../../lib/datetime/index.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:SA',
  url:
    'https://datasource.kapsarc.org/explore/dataset/saudi-arabia-coronavirus-disease-covid-19-situation/download/?format=csv&disjunctive.daily_cumulative=true&disjunctive.region=true&refine.daily_cumulative=Daily&timezone=America/Los_Angeles&lang=en&csv_separator=%2C',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const raw = await fetch.csv(this, this.url, 'default', false);
    const dataset = raw
      .filter(item => item.region !== 'Total')
      .map(item => ({ ...item, region: mapping[item.region] }));

    const casesData = dataset.filter(item => item.indicator === 'Cases');
    const deathsData = dataset.filter(item => item.indicator === 'Mortalities');
    const recoveredData = dataset.filter(item => item.indicator === 'Recoveries');

    const dataByRegion = {};

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.date, date)) {
        const dataObj = {
          cases: 0,
          ...dataByRegion[item.region]
        };
        dataObj.cases += parse.number(item.cases);
        dataByRegion[item.region] = dataObj;
      }
    }

    for (const item of deathsData) {
      if (datetime.dateIsBeforeOrEqualTo(item.date, date)) {
        const dataObj = {
          deaths: 0,
          ...dataByRegion[item.region]
        };
        dataObj.deaths += parse.number(item.cases);
        dataByRegion[item.region] = dataObj;
      }
    }

    for (const item of recoveredData) {
      if (datetime.dateIsBeforeOrEqualTo(item.date, date)) {
        const dataObj = {
          recovered: 0,
          ...dataByRegion[item.region]
        };
        dataObj.recovered += parse.number(item.cases);
        dataByRegion[item.region] = dataObj;
      }
    }

    const data = [];
    for (const region of Object.keys(dataByRegion)) {
      data.push({
        state: region,
        ...dataByRegion[region]
      });
    }

    if (data.length > 0) data.push(transform.sumData(data));

    return data;
  }
};

export default scraper;
