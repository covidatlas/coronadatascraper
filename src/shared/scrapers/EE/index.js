import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:EE',
  url: 'https://opendata.digilugu.ee/opendata_covid19_test_results.csv',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [
    {
      name: 'Estonia Health and Welfare Information Systems Center',
      url: 'https://www.terviseamet.ee/et/koroonaviirus/avaandmed'
    }
  ],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const testedData = await fetch.csv(this, this.url, 'default', false);

    const testedByCounty = {};
    const casesByCounty = {};

    let nationalTestCount;
    let nationalCasesCount;

    for (const item of testedData) {
      if (datetime.dateIsBeforeOrEqualTo(item.StatisticsDate, date)) {
        if (item.County) {
          testedByCounty[item.County] = 1 + (testedByCounty[item.County] || 0);
          casesByCounty[item.County] = (item.ResultValue === 'P' ? 1 : 0) + (casesByCounty[item.County] || 0);
        } else {
          nationalCasesCount = (item.ResultValue === 'P' ? 1 : 0) + (nationalCasesCount || 0);
          nationalTestCount = 1 + (nationalTestCount || 0);
        }
      }
    }

    const data = [];

    for (const county of Object.keys(testedByCounty)) {
      data.push({
        state: mapping[county],
        tested: testedByCounty[county],
        cases: casesByCounty[county]
      });
    }

    if (nationalTestCount || data.length > 0)
      data.push(
        transform.sumData(data, {
          tested: nationalTestCount,
          cases: nationalCasesCount
        })
      );

    return data;
  }
};

export default scraper;
