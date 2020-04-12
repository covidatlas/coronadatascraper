import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';
// import * as transform from '../../lib/transform.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:IE',
  url: 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-ie.csv',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [
    {
      description: 'COVID-19/SARS-COV-2 Cases in EU by Country, State/Province/Local Authorities, and Date',
      url: 'https://github.com/covid19-eu-zh/covid19-eu-data',
      name: 'covid19-eu-data'
    }
  ],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesData = await fetch.csv(this.url, false);

    const casesByRegion = {};

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.datetime, date)) {
        casesByRegion[item.lau] = parse.number(item.cases);
      }
    }

    const data = [];

    for (const region of Object.keys(casesByRegion)) {
      data.push({
        state: mapping[region],
        cases: casesByRegion[region]
      });
    }

    // Count is slightly off compared to JHU. Trust JHU but keep regional data.
    // if (data.length > 0) data.push(transform.sumData(data));

    return data;
  }
};

export default scraper;
