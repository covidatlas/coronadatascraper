import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:NL',
  url: 'https://onemocneni-aktualne.mzcr.cz/',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesURL =
      'https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_NL_covid19_province.csv';

    const casesData = await fetch.csv(casesURL, false);

    const casesByProvince = {};

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.Datum, date) && item.Provincienaam) {
        casesByProvince[item.Provincienaam] = parse.number(item.Aantal);
      }
    }

    const data = [];

    for (const region of Object.keys(casesByProvince)) {
      data.push({
        state: mapping[region],
        cases: casesByProvince[region]
      });
    }

    data.push(transform.sumData(data));

    return data;
  }
};

export default scraper;
