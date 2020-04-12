import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';
import * as transform from '../../lib/transform.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:PL',
  url: 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-pl.csv',
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
    const deathsByRegion = {};

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.datetime, date) && item.nuts_2) {
        casesByRegion[item.nuts_2] = parse.number(item.cases);
        deathsByRegion[item.nuts_2] = parse.number(item.deaths);
      }
    }

    const data = [];

    // FIXME: missing some ISO codes. Pushing the name we receive in the meantime
    for (const region of Object.keys(casesByRegion)) {
      data.push({
        state: mapping[region] || region,
        cases: casesByRegion[region]
      });
    }

    if (data.length > 0) data.push(transform.sumData(data));

    return data;
  }
};

export default scraper;
