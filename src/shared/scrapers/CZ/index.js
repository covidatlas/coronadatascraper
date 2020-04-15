import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'iso1:CZ',
  url: 'https://onemocneni-aktualne.mzcr.cz/',
  timeseries: true,
  priority: 1,
  type: 'csv',
  sources: [
    {
      url: 'https://onemocneni-aktualne.mzcr.cz/',
      name: 'Ministry of Health of the Czech Republic'
    }
  ],
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesURL = 'https://onemocneni-aktualne.mzcr.cz/api/v1/covid-19/osoby.csv';
    const testedURL = 'https://onemocneni-aktualne.mzcr.cz/api/v1/covid-19/testy.csv';

    const casesData = await fetch.csv(this, casesURL, 'cases', false);
    const testedData = await fetch.csv(this, testedURL, 'tested', false);

    const casesByRegion = {};

    for (const item of casesData) {
      // Yes, there is a weird character here, it is intentional
      if (datetime.dateIsBeforeOrEqualTo(item['﻿datum_hlaseni'], date)) {
        casesByRegion[item.kraj] = 1 + (casesByRegion[item.kraj] || 0);
      }
    }

    let numTests;
    for (const item of testedData) {
      // Yes, there is a weird character here, it is intentional
      if (datetime.dateIsBeforeOrEqualTo(item['﻿datum'], date)) {
        numTests = parse.number(item.testy_celkem);
      }
    }

    const data = [];

    for (const region of Object.keys(casesByRegion)) {
      data.push({
        state: `iso2:CZ-${region.substring(3, 7)}`,
        cases: casesByRegion[region]
      });
    }

    if (numTests || data.length > 0) data.push(transform.sumData(data, { tested: numTests }));

    return data;
  }
};

export default scraper;
