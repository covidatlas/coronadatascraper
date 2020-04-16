import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import * as parse from '../../lib/parse.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:SI',
  url: 'https://raw.githubusercontent.com/slo-covid-19/data/master/csv/stats.csv',
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [
    {
      url: 'https://covid-19.sledilnik.org/',
      name: 'COVID-19 Sledilnik'
    }
  ],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesData = await fetch.csv(this, this.url, 'cases', false);
    const regionUrl = 'https://raw.githubusercontent.com/slo-covid-19/data/master/csv/regions.csv';
    const regionData = await fetch.csv(this, regionUrl, 'region', false);

    let nationalData = {};

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.date, date)) {
        nationalData = {
          tests: parse.number(item['tests.performed.todate']) || nationalData.tests,
          cases: parse.number(item['cases.confirmed.todate']) || nationalData.cases,
          hospitalized: parse.number(item['state.in_hospital.todate']) || nationalData.hospitalized,
          discharged: parse.number(item['state.out_of_hospital.todate']) || nationalData.discharged,
          deaths: parse.number(item['state.deceased.todate']) || nationalData.deaths,
          recovered: parse.number(item['state.recovered.todate']) || nationalData.recovered
        };
      }
    }

    const casesByRegion = {};
    for (const item of regionData) {
      if (datetime.dateIsBeforeOrEqualTo(item.date, date)) {
        for (const region of Object.keys(mapping)) {
          casesByRegion[region] = item[region] ? parse.number(item[region]) : casesByRegion[region];
        }
      }
    }

    const data = [];

    for (const region of Object.keys(mapping)) {
      if (mapping[region]) {
        data.push({
          state: mapping[region],
          cases: casesByRegion[region]
        });
      }
    }

    if (data.length > 0) data.push(nationalData);

    return data;
  }
};

export default scraper;
