import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:AT',
  url: 'https://onemocneni-aktualne.mzcr.cz/',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesURL = 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-at.csv';

    const casesData = await fetch.csv(casesURL, false);

    const casesByRegion = {};
    const hospitalizedByRegion = {};

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.datetime, date) && item.nuts_2) {
        casesByRegion[item.nuts_2] = parse.number(item.cases);
        hospitalizedByRegion[item.nuts_2] = parse.number(item.hospitalized);
      }
    }

    const data = [];

    for (const region of Object.keys(casesByRegion)) {
      data.push({
        state: mapping[region],
        cases: casesByRegion[region],
        hospitalized: hospitalizedByRegion[region]
      });
    }

    data.push(transform.sumData(data));

    return data;
  }
};

export default scraper;
