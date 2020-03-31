import path from 'path';
import * as fetch from '../lib/fetch/index.js';
import * as parse from '../lib/parse.js';
import * as geography from '../lib/geography/index.js';
import * as datetime from '../lib/datetime.js';
import * as transform from '../lib/transform.js';
import * as rules from '../lib/rules.js';
import * as fs from '../lib/fs.js';
import maintainers from '../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  maintainers: [maintainers.lazd],
  url: 'https://github.com/CSSEGISandData/COVID-19',
  timeseries: true,
  priority: -1,
  curators: [
    {
      name: 'JHU CSSE',
      url: 'https://systems.jhu.edu/research/public-health/ncov/'
    }
  ],
  _urls: {
    cases:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/fe22260f2e5e1f7326f3164d27ccaef48c183cb5/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
    deaths:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/fe22260f2e5e1f7326f3164d27ccaef48c183cb5/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
    recovered:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/fe22260f2e5e1f7326f3164d27ccaef48c183cb5/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'
  },
  _urlsNew: {
    cases:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
    deaths:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv',
    recovered:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'
  },
  _urlsOld: {
    cases:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/a3e83c7bafdb2c3f310e2a0f6651126d9fe0936f/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
    deaths:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/a3e83c7bafdb2c3f310e2a0f6651126d9fe0936f/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
    recovered:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/a3e83c7bafdb2c3f310e2a0f6651126d9fe0936f/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'
  },
  _reject: [
    {
      'Province/State': 'Diamond Princess'
    },
    {
      'Country/Region': 'Diamond Princess'
    },
    {
      'Province/State': 'Grand Princess'
    },
    {
      'Province/State': 'From Diamond Princess'
    },
    {
      'Country/Region': 'MS Zaandam'
    },
    {
      'Country/Region': 'West Bank and Gaza'
    }
  ],
  _accept: [
    {
      'Province/State': ''
    },
    {
      'Country/Region': 'France'
    },
    {
      'Country/Region': 'United Kingdom'
    },
    {
      'Country/Region': 'China'
    },
    {
      'Country/Region': 'Denmark'
    },
    {
      'Country/Region': 'Belgium'
    },
    {
      'Country/Region': 'Netherlands'
    },
    {
      'Country/Region': 'Australia'
    }
  ],
  _getRecovered(recovered, state, country) {
    for (const location of recovered) {
      // Believe it or not, the conditional for Province/State is intentionally duplicate -- there is an invisible space in there
      // Thanks, JHU!
      if (
        (location['﻿Province/State'] === state || location['Province/State'] === state) &&
        location['Country/Region'] === country
      ) {
        return location;
      }
    }
  },
  _rollup(locations) {
    const countriesToRoll = {};
    const countriesToNotRoll = {};

    for (const location of locations) {
      if (location.state && location.country && !location.county) {
        countriesToRoll[location.country] = true;
      }
      if (!location.state && location.country && !location.county) {
        countriesToNotRoll[location.country] = true;
      }
    }

    for (const country of Object.keys(countriesToNotRoll)) {
      delete countriesToRoll[country];
    }

    for (const country of Object.keys(countriesToRoll)) {
      // Find everything matching this region and roll it up
      const regions = [];
      for (const location of locations) {
        if (location.country === country) {
          regions.push(location);
        }
      }
      locations.push(transform.sumData(regions, { country, aggregate: 'state' }));
    }
  },
  scraper: {
    '0': async function() {
      // Build a hash of US counties
      const jhuUSCountyMap = await fs.readJSON(path.join(__dirname, '..', 'vendor', 'jhu-us-county-map.json'));

      const getOldData = datetime.scrapeDateIsBefore('2020-3-12');

      if (getOldData) {
        console.log('  🕰  Fetching old data for %s', process.env.SCRAPE_DATE);
      }

      const urls = getOldData ? this._urlsOld : this._urls;
      const cases = await fetch.csv(urls.cases, false);
      const deaths = await fetch.csv(urls.deaths, false);
      const recovered = await fetch.csv(urls.recovered, false);

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

      const countyTotals = {};
      for (let index = 0; index < cases.length; index++) {
        if (cases[index]['Country/Region'] === cases[index]['Province/State']) {
          // Axe incorrectly categorized data
          delete cases[index]['Province/State'];
        }
        if (getOldData) {
          // See if it's a county
          const countyAndState = jhuUSCountyMap[cases[index]['Province/State']];
          if (countyAndState) {
            if (countyTotals[countyAndState]) {
              // Add
              countyTotals[countyAndState].cases += parse.number(cases[index][date] || 0);
              countyTotals[countyAndState].deaths += parse.number(deaths[index][date] || 0);
              countyTotals[countyAndState].recovered += parse.number(recovered[index][date] || 0);
            } else {
              let [county, state] = countyAndState.split(', ');
              const regionObj = {
                aggregate: 'state',
                country: 'USA',
                cases: parse.number(cases[index][date] || 0),
                recovered: parse.number(recovered[index][date] || 0),
                deaths: parse.number(deaths[index][date] || 0),
                coordinates: [parse.float(cases[index].Long), parse.float(cases[index].Lat)]
              };
              if (county === 'District of Columbia') {
                county = null;
                state = 'DC';
              }
              if (county) {
                regionObj.county = county;
              }
              if (state) {
                regionObj.state = state;
              }
              countyTotals[countyAndState] = regionObj;
            }
          }
        }

        // These two incorrectly have a state set
        if (cases[index]['Province/State'] === 'United Kingdom' || cases[index]['Province/State'] === 'France') {
          cases[index]['Province/State'] = '';
        }

        // Use their US states
        if (
          cases[index]['Country/Region'] === 'US' &&
          geography.usStates[parse.string(cases[index]['Province/State'] || '')]
        ) {
          const state = geography.usStates[parse.string(cases[index]['Province/State'])];
          countries.push({
            aggregate: 'state',
            country: 'USA',
            state,
            cases: parse.number(cases[index][date] || 0),
            recovered: parse.number(recovered[index][date] || 0),
            deaths: parse.number(deaths[index][date] || 0)
          });
        } else if (rules.isAcceptable(cases[index], this._accept, this._reject)) {
          const caseData = {
            aggregate: 'country',
            country: parse.string(cases[index]['Country/Region']),
            cases: parse.number(cases[index][date] || 0),
            recovered: parse.number(recovered[index][date] || 0),
            deaths: parse.number(deaths[index][date] || 0),
            coordinates: [parse.float(cases[index].Long), parse.float(cases[index].Lat)]
          };

          if (cases[index]['Province/State']) {
            caseData.aggregate = 'state';
            caseData.state = parse.string(cases[index]['Province/State']);
          }

          countries.push(caseData);
        }
      }

      // Add counties
      for (const [, countyData] of Object.entries(countyTotals)) {
        countries.push(countyData);
      }

      this._rollup(countries);

      return countries;
    },
    '2020-3-24': async function() {
      const urls = this._urlsNew;
      const cases = await fetch.csv(urls.cases, false);
      const deaths = await fetch.csv(urls.deaths, false);
      const recovered = await fetch.csv(urls.recovered, false);

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

      const countyTotals = {};
      for (let index = 0; index < cases.length; index++) {
        const recoveredData = this._getRecovered(
          recovered,
          cases[index]['Province/State'],
          cases[index]['Country/Region']
        );
        if (cases[index]['Country/Region'] === cases[index]['Province/State']) {
          // Axe incorrectly categorized data
          delete cases[index]['Province/State'];
        }

        // These two incorrectly have a state set
        if (cases[index]['Province/State'] === 'United Kingdom' || cases[index]['Province/State'] === 'France') {
          cases[index]['Province/State'] = '';
        }

        // Use their US states
        if (
          cases[index]['Country/Region'] === 'US' &&
          geography.usStates[parse.string(cases[index]['Province/State'] || '')]
        ) {
          const state = geography.usStates[parse.string(cases[index]['Province/State'])];
          const caseData = {
            aggregate: 'state',
            country: 'USA',
            state,
            cases: parse.number(cases[index][date] || 0),
            deaths: parse.number(deaths[index][date] || 0),
            recovered: parse.number(recoveredData[date] || 0)
          };

          if (recoveredData) {
            const recoveredCount = recoveredData[datetime.getMDYYYY(date)];
            if (recoveredCount !== undefined) {
              caseData.recovered = parse.number(recoveredCount);
            }
          }

          countries.push(caseData);
        } else if (rules.isAcceptable(cases[index], this._accept, this._reject)) {
          const caseData = {
            aggregate: 'country',
            country: parse.string(cases[index]['Country/Region']),
            cases: parse.number(cases[index][date] || 0),
            deaths: parse.number(deaths[index][date] || 0),
            coordinates: [parse.float(cases[index].Long), parse.float(cases[index].Lat)]
          };

          if (recoveredData) {
            const recoveredCount = recoveredData[datetime.getMDYYYY(date)];
            if (recoveredCount !== undefined) {
              caseData.recovered = parse.number(recoveredCount);
            }
          }

          if (cases[index]['Province/State']) {
            caseData.aggregate = 'state';
            caseData.state = parse.string(cases[index]['Province/State']);
          }

          countries.push(caseData);
        }
      }

      // Add counties
      for (const [, countyData] of Object.entries(countyTotals)) {
        countries.push(countyData);
      }

      this._rollup(countries);

      return countries;
    }
  }
};

export default scraper;
