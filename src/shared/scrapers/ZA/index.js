import assert from 'assert';

import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import maintainers from '../../lib/maintainers.js';
import datetime from '../../lib/datetime/index.js';

const addDateSeparators = date => `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;

const scraper = {
  country: 'iso1:ZA',
  url: 'https://github.com/dsfsi/covid19za',
  timeseries: true,
  priority: 1,
  type: 'csv',
  sources: [
    {
      description:
        'COVID 19 Data for South Africa created, maintained and hosted by Data Science for Social Impact research group, led by Dr. Vukosi Marivate, at the University of Pretoria.',
      url: 'https://github.com/dsfsi/covid19za',
      name: 'Coronavirus COVID-19 (2019-nCoV) Data Repository for South Africa'
    }
  ],
  maintainers: [maintainers.qgolsteyn],
  _province: ['EC', 'FS', 'GP', 'KZN', 'LP', 'MP', 'NC', 'NW', 'WC'],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesUrl =
      'https://raw.githubusercontent.com/dsfsi/covid19za/master/data/covid19za_provincial_cumulative_timeline_confirmed.csv';
    const casesData = await fetch.csv(this, casesUrl, 'cases', false);

    const deathsUrl = 'https://raw.githubusercontent.com/dsfsi/covid19za/master/data/covid19za_timeline_deaths.csv';
    const deathsData = await fetch.csv(this, deathsUrl, 'deaths', false);

    const testedUrl = 'https://raw.githubusercontent.com/dsfsi/covid19za/master/data/covid19za_timeline_testing.csv';
    const testedData = await fetch.csv(this, testedUrl, 'tested', false);

    const dataByProvince = {};
    const nationalData = { tested: 0, deaths: 0, cases: 0 };

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(addDateSeparators(item.YYYYMMDD), date)) {
        for (const col of Object.keys(item)) {
          if (this._province.findIndex(prov => prov === col) !== -1) {
            dataByProvince[col] = {
              ...dataByProvince[col],
              state: `iso2:ZA-${col}`,
              cases: parse.number(item[col]) || (dataByProvince[col] ? dataByProvince[col].cases : undefined),
              deaths: 0
            };
          } else if (col === 'total') {
            nationalData.cases = parse.number(item[col]);
          }
        }
      }
    }

    assert(Object.keys(dataByProvince).length === 9, 'Missing province data');

    for (const item of testedData) {
      if (datetime.dateIsBeforeOrEqualTo(addDateSeparators(item.YYYYMMDD), date)) {
        nationalData.tested = parse.number(item.cumulative_tests) || nationalData.tested;
      }
    }

    for (const item of deathsData) {
      if (datetime.dateIsBeforeOrEqualTo(addDateSeparators(item.YYYYMMDD), date)) {
        if (item.province) {
          dataByProvince[item.province].deaths += 1;
        }

        nationalData.deaths += 1;
      }
    }

    return [nationalData, ...Object.values(dataByProvince)];
  }
};

export default scraper;
