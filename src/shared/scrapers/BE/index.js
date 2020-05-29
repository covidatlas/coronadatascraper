import assert from 'assert';

import iso2Codes from 'country-levels/iso2.json';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';

import mappings from './iso-mapping.json';

const scraper = {
  country: 'iso1:BE',
  url: 'https://epistat.wiv-isp.be/',
  timeseries: true,
  priority: 1,
  type: 'csv',
  sources: [
    {
      description:
        'Sciensano is a public belgian scientific institution focused on public and animal health assignments.',
      name: 'Sciensano',
      url: 'https://www.sciensano.be/en'
    }
  ],
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesUrl = 'https://epistat.sciensano.be/Data/COVID19BE_CASES_AGESEX.csv';
    const casesData = await fetch.csv(this, casesUrl, 'cases', false);
    const deathsUrl = 'https://epistat.sciensano.be/Data/COVID19BE_MORT.csv';
    const deathsData = await fetch.csv(this, deathsUrl, 'deaths', false);
    const hospUrl = 'https://epistat.sciensano.be/Data/COVID19BE_HOSP.csv';
    const hospitalizedData = await fetch.csv(this, hospUrl, 'hospitalized', false);
    const testsUrl = 'https://epistat.sciensano.be/Data/COVID19BE_tests.csv';
    const testsData = await fetch.csv(this, testsUrl, 'tests', false);

    const dataByRegion = {};
    const dataByProvince = {};
    let nationalData = { tested: 0 };

    for (const item of casesData) {
      if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
        if (!dataByProvince[item.REGION]) {
          dataByProvince[item.REGION] = {};
        }
        const regionData = dataByProvince[item.REGION];

        if (!regionData[item.PROVINCE]) {
          regionData[item.PROVINCE] = {};
        }
        const provinceData = regionData[item.PROVINCE];

        provinceData.cases = parse.number(item.CASES) + (provinceData.cases || 0);
      }
    }

    for (const item of deathsData) {
      if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
        if (!dataByRegion[item.REGION]) {
          dataByRegion[item.REGION] = {};
        }
        const regionData = dataByRegion[item.REGION];

        regionData.deaths = parse.number(item.DEATHS) + (regionData.deaths || 0);
      }
    }

    for (const item of hospitalizedData) {
      if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
        if (!dataByProvince[item.REGION]) {
          dataByProvince[item.REGION] = {};
        }
        const regionData = dataByProvince[item.REGION];

        if (!regionData[item.PROVINCE]) {
          regionData[item.REGION] = {};
        }
        const provinceData = regionData[item.PROVINCE];

        provinceData.hospitalized_current = parse.number(item.NEW_IN) + (provinceData.hospitalized || 0);
        provinceData.discharged = parse.number(item.NEW_OUT) + (provinceData.discharged || 0);
      }
    }

    for (const item of testsData) {
      if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
        nationalData.tested += parse.number(item.TESTS);
      }
    }

    const data = [];

    for (const reg of Object.keys(dataByProvince)) {
      let regionData = {
        state: mappings[reg],
        ...dataByRegion[reg]
      };

      if (reg === 'Flanders' || reg === 'Wallonia') {
        const provinceData = [];
        for (const prov of Object.keys(dataByProvince[reg])) {
          provinceData.push({
            state: mappings[reg],
            county: mappings[prov],
            ...dataByProvince[reg][prov]
          });
        }

        regionData = transform.sumData(provinceData, regionData);
        data.push(...provinceData);
        data.push(regionData);
      } else if (reg === 'Brussels') {
        regionData = {
          ...dataByProvince[reg][reg],
          ...regionData
        };

        // Brussels is both a region and a province. Add to both
        data.push({
          ...regionData,
          county: mappings[reg]
        });
        data.push(regionData);
      } else if (reg === 'NA') {
        // Simply add this to the country total
        regionData = {
          ...dataByProvince[reg][reg],
          ...regionData
        };
      }
      nationalData = transform.sumData([regionData], nationalData);
    }

    data.push(nationalData);

    for (const item of data) {
      assert(!item.state || iso2Codes[item.state.replace('iso2:', '')], `Missing iso2 code for region ${item.state}`);
      assert(
        !item.county || iso2Codes[item.county.replace('iso2:', '')],
        `Missing iso2 code for province ${item.county}`
      );
    }

    return data;
  }
};

export default scraper;
