import path from 'path';
import * as fetch from '../lib/fetch.js';
import * as parse from '../lib/parse.js';
import * as transform from '../lib/transform.js';
import * as datetime from '../lib/datetime.js';
import * as rules from '../lib/rules.js';
import * as fs from '../lib/fs.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  url: 'https://github.com/CSSEGISandData/COVID-19',
  timeseries: true,
  aggregate: 'state',
  priority: -1,
  _urls: {
    cases: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
    deaths: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
    recovered: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'
  },
  _urlsOld: {
    cases: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/a3e83c7bafdb2c3f310e2a0f6651126d9fe0936f/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
    deaths: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/a3e83c7bafdb2c3f310e2a0f6651126d9fe0936f/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
    recovered: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/a3e83c7bafdb2c3f310e2a0f6651126d9fe0936f/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'
  },
  _reject: [{ 'Province/State': 'Diamond Princess' }, { 'Province/State': 'Grand Princess' }, { 'Province/State': 'From Diamond Princess' }],
  _accept: [{ 'Province/State': '' }, { 'Country/Region': 'France' }, { 'Country/Region': 'United Kingdom' }, { 'Country/Region': 'China' }, { 'Country/Region': 'Denmark' }, { 'Country/Region': 'Belgium' }, { 'Country/Region': 'Netherlands' }, { 'Country/Region': 'Australia' }],
  async scraper() {
    const jhuUSCountyMap = await fs.readJSON(path.join('coronavirus-data-sources', 'lib', 'jhuUSCountyMap.json'));
    const getOldData = datetime.scrapeDateIsBefore('2020-3-12');
    if (getOldData) {
      console.log('  \uD83D\uDD70  Fetching old data for %s', process.env.SCRAPE_DATE);
    }
    const urls = getOldData ? this._urlsOld : this._urls;
    const cases = await fetch.csv(urls.cases, false);
    const deaths = await fetch.csv(urls.deaths, false);
    const recovered = await fetch.csv(urls.recovered, false);
    const countries = [];
    let date = Object.keys(cases[0]).pop();
    if (process.env.SCRAPE_DATE) {
      const customDate = datetime.getMDYY(new Date(process.env.SCRAPE_DATE));
      if (!cases[0][customDate]) {
        console.warn('  \u26A0️  No data present for %s, output will be empty', customDate);
      }
      date = customDate;
    }
    const countyTotals = {};
    for (let index = 0; index < cases.length; index++) {
      if (cases[index]['Country/Region'] === cases[index]['Province/State']) {
        delete cases[index]['Province/State'];
      }
      if (getOldData) {
        const countyAndState = jhuUSCountyMap[cases[index]['Province/State']];
        if (countyAndState) {
          if (countyTotals[countyAndState]) {
            countyTotals[countyAndState].cases += parse.number(cases[index][date] || 0);
            countyTotals[countyAndState].deaths += parse.number(deaths[index][date] || 0);
            countyTotals[countyAndState].recovered += parse.number(recovered[index][date] || 0);
          } else {
            const [county, state] = countyAndState.split(', ');
            countyTotals[countyAndState] = {
              county,
              state,
              country: 'USA',
              cases: parse.number(cases[index][date] || 0),
              recovered: parse.number(recovered[index][date] || 0),
              deaths: parse.number(deaths[index][date] || 0),
              coordinates: [parse.float(cases[index].Long), parse.float(cases[index].Lat)]
            };
          }
        }
      }
      if (cases[index]['Province/State'] === 'United Kingdom' || cases[index]['Province/State'] === 'France') {
        cases[index]['Province/State'] = '';
      }
      if (cases[index]['Country/Region'] === 'US' && transform.usStates[parse.string(cases[index]['Province/State'])]) {
        const state = transform.usStates[parse.string(cases[index]['Province/State'])];
        countries.push({
          country: 'USA',
          state,
          cases: parse.number(cases[index][date] || 0),
          recovered: parse.number(recovered[index][date] || 0),
          deaths: parse.number(deaths[index][date] || 0)
        });
      } else if (rules.isAcceptable(cases[index], this._accept, this._reject)) {
        const caseData = {
          country: parse.string(cases[index]['Country/Region']),
          cases: parse.number(cases[index][date] || 0),
          recovered: parse.number(recovered[index][date] || 0),
          deaths: parse.number(deaths[index][date] || 0),
          coordinates: [parse.float(cases[index].Long), parse.float(cases[index].Lat)]
        };
        if (cases[index]['Province/State']) {
          caseData.state = parse.string(cases[index]['Province/State']);
        }
        countries.push(caseData);
      }
    }
    for (const [, countyData] of Object.entries(countyTotals)) {
      countries.push(countyData);
    }
    return countries;
  }
};

export default scraper;
