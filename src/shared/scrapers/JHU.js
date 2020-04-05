import iso2Codes from 'country-levels/iso2.json';
import datetime from '../lib/datetime/index.js';
import * as fetch from '../lib/fetch/index.js';
import { splitId } from '../lib/geography/country-levels.js';
import maintainers from '../lib/maintainers.js';
import * as parse from '../lib/parse.js';
import * as transform from '../lib/transform.js';

const stateMap = {
  'Hong Kong': 'iso1:HK',
  Macau: 'iso1:MO',
  Greenland: 'iso1:GL'
};

const scraper = {
  maintainers: [maintainers.lazd],
  url: 'https://github.com/CSSEGISandData/COVID-19',
  timeseries: true,
  priority: -1,
  country: '_JHU', // every location needs to have a valid country
  scraperTz: 'America/Los_Angeles',
  curators: [
    {
      name: 'JHU CSSE',
      url: 'https://systems.jhu.edu/research/public-health/ncov/'
    }
  ],

  _urls: {
    cases:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
    deaths:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv',
    recovered:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv',
    isoMap:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv'
  },
  _getRecovered(recovered, state, country) {
    for (const location of recovered) {
      if (location['Province/State'] === state && location['Country/Region'] === country) {
        return location;
      }
    }
  },
  _rollup(locations) {
    // get all countries with states
    const countriesToRoll = new Set(locations.filter(l => l.state).map(l => l.country));

    // calculate sumData for each country
    for (const country of countriesToRoll) {
      const regions = locations.filter(l => l.country === country);
      const countrySum = transform.sumData(regions, { country, aggregate: 'state' });
      locations.push(countrySum);
    }
  },
  _createIsoMap(isoMapCsv) {
    const isoMap = {};

    const stateNameByCountry = {};
    for (const data of Object.values(iso2Codes)) {
      const { iso2, name } = data;
      const countrylevelId = data.countrylevel_id;
      const countryCode = iso2.slice(0, 2);
      stateNameByCountry[countryCode] = stateNameByCountry[countryCode] || {};
      stateNameByCountry[countryCode][name] = countrylevelId;
    }

    for (const row of isoMapCsv) {
      const country = row.Country_Region;
      const state = row.Province_State;
      const countryCode = row.iso2;

      if (!countryCode) {
        continue;
      }

      // using a key like 'Australia#New South Wales'
      const key = `${country}#${state}`;

      // US is in other file
      if (country === 'US') {
        continue;
      }

      if (state in stateMap) {
        isoMap[key] = stateMap[state];
        continue;
      }

      if (!state) {
        isoMap[key] = `iso1:${countryCode}`;
      } else {
        const stateNames = stateNameByCountry[countryCode];
        if (!stateNames) {
          console.warn(`  createIsoMap 1: ${state} needs to be added to stateMap`);
          continue;
        }
        const clId = stateNames[state];
        if (!clId) {
          console.warn(`  createIsoMap 2: ${state} needs to be added added to stateMap`);
        }
        isoMap[key] = clId;
      }
    }
    return isoMap;
  },
  scraper: {
    '0': async function() {
      const urls = this._urls;
      const cases = await fetch.csv(urls.cases, false);
      const deaths = await fetch.csv(urls.deaths, false);
      const recovered = await fetch.csv(urls.recovered, false);
      const isoMapCsv = await fetch.csv(urls.isoMap, false);

      const isoMap = this._createIsoMap(isoMapCsv);

      const countries = [];
      let date = Object.keys(cases[0]).pop();

      if (process.env.SCRAPE_DATE) {
        // Find old date
        const customDate = datetime.getMDYY(new Date(process.env.SCRAPE_DATE));
        if (!cases[0][customDate]) {
          console.warn('  ⚠️  No data present for %s, output will be empty', customDate);
        }
        date = customDate;
      }

      for (let index = 0; index < cases.length; index++) {
        const row = cases[index];
        const country = row['Country/Region'];
        const state = row['Province/State'];

        const key = `${country}#${state}`;
        const clId = isoMap[key];
        if (!clId) {
          console.warn(`Skipping ${country} ${state}`);
          continue;
        }

        const recoveredData = this._getRecovered(recovered, state, country);

        const caseData = {
          cases: parse.number(row[date] || 0),
          deaths: parse.number(deaths[index][date] || 0)
        };

        if (recoveredData) {
          const recoveredCount = recoveredData[date];
          if (recoveredCount !== undefined) {
            caseData.recovered = parse.number(recoveredCount);
          }
        }

        const { level, code } = splitId(clId);
        if (level === 'iso1') {
          caseData.aggregate = 'country';
          caseData.country = clId;
        } else {
          const countryCode = code.slice(0, 2);
          caseData.aggregate = 'state';
          caseData.state = clId;
          caseData.country = `iso1:${countryCode}`;
        }

        countries.push(caseData);
      }

      this._rollup(countries);

      return countries;
    }
  }
};

export default scraper;
