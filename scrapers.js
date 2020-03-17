import path from 'path';
import * as fetch from './lib/fetch.js';
import * as parse from './lib/parse.js';
import * as transform from './lib/transform.js';
import * as datetime from './lib/datetime.js';
import * as rules from './lib/rules.js';
import * as fs from './lib/fs.js';

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

const scrapers = [
  {
    state: 'AZ',
    country: 'USA',
    url: 'https://tableau.azdhs.gov/views/COVID-19Dashboard/COVID-19table?:isGuestRedirectFromVizportal=y&:embed=y',
    async _scraper() {
      // let { browser, page } = await fetch.headless(this.url);

      const counties = [];
      // do stuff

      // await browser.close();
      return counties;
    }
  },
  {
    url: 'https://opendata.arcgis.com/datasets/d14de7e28b0448ab82eb36d6f25b1ea1_0.csv',
    country: 'USA',
    state: 'IN',
    aggregate: 'county',
    _countyMap: {
      'Verm.': 'Vermillion',
      'Vander.': 'Vanderburgh',
      'St Joseph': 'St. Joseph'
    },
    async scraper() {
      const data = await fetch.csv(this.url);

      const counties = [];
      for (const county of data) {
        let countyName = parse.string(county.COUNTYNAME);
        countyName = this._countyMap[countyName] || countyName;
        counties.push({
          county: transform.addCounty(countyName),
          cases: parse.number(county.Total_Positive),
          deaths: parse.number(county.Total_Deaths),
          tested: parse.number(county.Total_Tested)
        });
      }

      return counties;
    }
  },
  {
    url: 'https://opendata.arcgis.com/datasets/969678bce431494a8f64d7faade6e5b8_0.csv',
    country: 'USA',
    state: 'NC',
    aggregate: 'county',
    async scraper() {
      const data = await fetch.csv(this.url);

      const counties = [];
      for (const county of data) {
        counties.push({
          county: transform.addCounty(parse.string(county.County)),
          cases: parse.number(county.Total), // Includes presumptive
          // recovered: parse.number(county.Recovered),
          deaths: parse.number(county.Deaths)
        });
      }

      // Add summed state data
      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    url: 'https://opendata.arcgis.com/datasets/8840fd8ac1314f5188e6cf98b525321c_0.csv',
    country: 'USA',
    state: 'NJ',
    aggregate: 'county',
    async scraper() {
      const data = await fetch.csv(this.url);

      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.COUNTY_LAB),
          cases: parse.number(county.Positives),
          tested: parse.number(county.Negatives) + parse.number(county.Positives)
        });
      }

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    country: 'Canada',
    url: 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html',
    type: 'table',
    _reject: [
      {
        state: 'Repatriated travellers'
      },
      {
        state: 'Total cases'
      }
    ],
    aggregate: 'state',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $table = $('h2:contains("Current situation")')
        .nextAll('table')
        .first();

      const $trs = $table.find('tbody > tr');

      const regions = [];

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const data = {
          state: parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:nth-child(2)').text())
        };
        if (rules.isAcceptable(data, null, this._reject)) {
          regions.push(data);
        }
      });

      return regions;
    }
  },
  {
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
    _reject: [
      {
        'Province/State': 'Diamond Princess'
      },
      {
        'Province/State': 'Grand Princess'
      },
      {
        'Province/State': 'From Diamond Princess'
      }
    ],
    _accept: [
      {
        'Province/State': 'St Martin',
        'Country/Region': 'France'
      },
      {
        'Province/State': 'French Polynesia',
        'Country/Region': 'France'
      },
      {
        'Province/State': 'Channel Islands',
        'Country/Region': 'United Kingdom'
      },
      {
        'Province/State': 'Gibraltar',
        'Country/Region': 'United Kingdom'
      },
      {
        'Province/State': 'Saint Barthelemy',
        'Country/Region': 'France'
      },
      {
        'Province/State': ''
      },
      {
        'Country/Region': 'China'
      },
      {
        'Country/Region': 'Australia'
      }
    ],
    async scraper() {
      // Build a hash of US counties
      const jhuUSCountyMap = await fs.readJSON(path.join('coronavirus-data-sources', 'lib', 'jhuUSCountyMap.json'));

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

        // These two incorrectly have a state set
        if (cases[index]['Province/State'] === 'United Kingdom' || cases[index]['Province/State'] === 'France') {
          cases[index]['Province/State'] = '';
        }

        // Use their US states
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
          countries.push({
            country: parse.string(cases[index]['Country/Region']),
            state: parse.string(cases[index]['Province/State']),
            cases: parse.number(cases[index][date] || 0),
            recovered: parse.number(recovered[index][date] || 0),
            deaths: parse.number(deaths[index][date] || 0),
            coordinates: [parse.float(cases[index].Long), parse.float(cases[index].Lat)]
          });
        }
      }

      // Add counties
      for (const [, countyData] of Object.entries(countyTotals)) {
        countries.push(countyData);
      }

      return countries;
    }
  },
  {
    country: 'USA',
    url: 'https://www.cdc.gov/coronavirus/2019-ncov/map-data-cases.csv',
    _getCaseNumber(string) {
      if (typeof string === 'string') {
        const matches = string.match(/(\d+) of (\d+)/);
        if (string === 'None') {
          return 0;
        }
        if (matches) {
          // Return the high number
          return parse.number(matches[2]);
        }
        return parse.number(string);
      }
      return string;
    },
    async _scraper() {
      const data = await fetch.csv(this.url);

      const states = [];
      for (const stateData of data) {
        if (stateData.Name) {
          states.push({
            state: transform.toUSStateAbbreviation(parse.string(stateData.Name)),
            cases: this._getCaseNumber(stateData['Cases Reported'])
          });
        }
      }

      return states;
    }
  },
  {
    country: 'CHE',
    county: 'Zurich',
    url: 'https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Fallzahlen_Kanton_ZH_total.csv',
    timeseries: true,
    async scraper() {
      const data = await fetch.csv(this.url, false);

      let latestData;
      if (process.env.SCRAPE_DATE) {
        // Find old date
        const date = datetime.getDDMMYYYY(new Date(process.env.SCRAPE_DATE), '.');
        [latestData] = data.filter(dayData => dayData.Date === date);
      } else {
        latestData = data[data.length - 1];
      }

      return {
        recovered: parse.number(latestData.TotalCured),
        deaths: parse.number(latestData.TotalDeaths),
        cases: parse.number(latestData.TotalConfCases),
        tested: parse.number(latestData.TotalTestedCases)
      };
    }
  },
  {
    country: 'ITA',
    url: 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv',
    timeseries: true,
    aggregate: 'state',
    async scraper() {
      const data = await fetch.csv(this.url, false);

      let latestDate = data[data.length - 1].data.substr(0, 10);
      if (process.env.SCRAPE_DATE) {
        // Find old date
        latestDate = datetime.getYYYYMMDD(new Date(process.env.SCRAPE_DATE), '-');
      }

      // Get only records for that date
      return data
        .filter(row => {
          return row.data.substr(0, 10) === latestDate;
        })
        .map(row => {
          return {
            recovered: parse.number(row.dimessi_guariti),
            deaths: parse.number(row.deceduti),
            cases: parse.number(row.totale_casi),
            state: parse.string(row.denominazione_regione)
          };
        });
    }
  },
  {
    country: 'GBR',
    url: 'https://www.arcgis.com/sharing/rest/content/items/b684319181f94875a6879bbc833ca3a6/data',
    aggregate: 'county',
    type: 'csv', // required since URL does not end in .csv
    async scraper() {
      const data = await fetch.csv(this.url);

      const counties = [];
      for (const utla of data) {
        const name = parse.string(utla.GSS_NM);
        counties.push({
          county: name,
          cases: parse.number(utla.TotalCases)
        });
      }

      return counties;
    }
  },
  {
    state: 'MS',
    country: 'USA',
    url: 'https://msdh.ms.gov/msdhsite/_static/14,0,420.html',
    type: 'table',
    aggregate: 'county',
    async scraper() {
      const $ = await fetch.page(this.url);

      if (datetime.scrapeDateIsBefore('2020-3-15')) {
        const $table = $('h3:contains("Mississippi Cases")')
          .nextAll('table')
          .first();

        const $trs = $table.find('tbody > tr');

        const counties = {};

        $trs.each((index, tr) => {
          const $tr = $(tr);
          const status = $tr.find('td:nth-child(3)').text();
          const county = transform.addCounty(parse.string($tr.find('td:nth-child(2)').text()));

          // Make sure this matches once they have a confirmed case
          if (status === 'Confirmed' || status === 'Presumptive') {
            counties[county] = counties[county] || { cases: 0 };
            counties[county].cases++;
          }
        });

        const countiesArray = transform.objectToArray(counties);

        counties.push(transform.sumData(countiesArray));

        return countiesArray;
      }

      const $table = $('h4:contains("All Mississippi cases to date")')
        .nextAll('table')
        .first();

      const $trs = $table.find('tbody > tr');

      const counties = [];

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = transform.addCounty(parse.string($tr.find('td:first-child').text()));

        counties.push({
          county,
          cases: parse.number($tr.find('td:last-child').text())
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'DC',
    country: 'USA',
    url: 'https://coronavirus.dc.gov/page/coronavirus-data',
    type: 'paragraph',
    async scraper() {
      const $ = await fetch.page(this.url);

      let cases = 0;
      cases += parse.number(
        $('p:contains("Number of PHL positives")')
          .first()
          .text()
          .split(': ')[1]
      );
      cases += parse.number(
        $('p:contains("Number of commercial lab positives")')
          .first()
          .text()
          .split(': ')[1]
      );

      return {
        cases,
        tested: parse.number(
          $('p:contains("Number of people tested overall")')
            .first()
            .text()
            .split(': ')[1]
        )
      };
    }
  },
  {
    state: 'AL',
    country: 'USA',
    url: 'http://www.alabamapublichealth.gov/infectiousdiseases/2019-coronavirus.html',
    type: 'table',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);

      const $table = $('td:contains("(COVID-19) in Alabama")').closest('table');

      // Ignore the last row "Out of town"
      const $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        const $tr = $(tr);
        const countyName = transform.addCounty(parse.string($tr.find('td:first-child').text()));
        if (countyName === 'Out of State County') {
          return;
        }
        counties.push({
          county: countyName,
          cases: parse.number($tr.find('td:last-child').text())
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'CO',
    country: 'USA',
    url: 'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub',
    type: 'list',
    async scraper() {
      const $ = await fetch.page(this.url);

      if (datetime.scrapeDateIs('2020-3-16')) {
        return {
          cases: parse.number(
            $('span:contains("Positive")')
              .text()
              .split(':')[1]
          ),
          tested: parse.number(
            $('span:contains("Total number of people tested")')
              .text()
              .split(':')[1]
          )
        };
      }
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        const counties = [];

        const $lis = $('p:contains("Positive cases by county of residence")')
          .nextAll('ul')
          .first()
          .find('li');

        $lis.each((index, li) => {
          // This does not match "Out of state visitors"
          const matches = $(li)
            .text()
            .match(/(.*?): (\d+)/);
          if (matches) {
            let county = transform.addCounty(parse.string(matches[1]));
            if (county === 'Unknown county County') {
              county = UNASSIGNED;
            }
            const data = {
              county,
              cases: parse.number(matches[2])
            };
            counties.push(data);
          }
        });

        const visitorCounties = [];
        const $visitors = $('p:contains("Positive cases by county of residence")')
          .nextAll('p')
          .find('span');
        $visitors.each((index, visitor) => {
          const visitorInfo = $(visitor)
            .text()
            .match(/([A-Za-z]+) - (\d+)/);
          if (visitorInfo !== null && visitorInfo.length === 3) {
            const county = `${visitorInfo[1]} County`;
            const cases = visitorInfo[2];
            if (county.indexOf('information') === -1) {
              const data = {
                county: transform.addCounty(parse.string(county)),
                cases: parse.number(cases)
              };
              if (rules.isAcceptable(data, null, this._reject)) {
                visitorCounties.push(data);
              }
            }
          }
        });
        counties.forEach(county => {
          if (county.cases !== undefined && county.county !== undefined) {
            visitorCounties.forEach(visitorCounty => {
              if (visitorCounty.cases !== undefined && visitorCounty.county !== undefined) {
                if (visitorCounty.county === county.county) {
                  county.cases = visitorCounty.cases + county.cases;
                }
              }
            });
          }
        });
        counties.push(transform.sumData(counties));

        return counties;
      }
      throw new Error('Hey remember how Colorado is awful at reporting data? You gotta do manual work again today to get it');
    }
  },
  {
    state: 'OR',
    country: 'USA',
    url: 'https://www.oregon.gov/oha/PH/DISEASESCONDITIONS/DISEASESAZ/Pages/emerging-respiratory-infections.aspx',
    type: 'table',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);

      const $table = $('table[summary="Cases by County in Oregon for COVID-19"]');

      const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = transform.addCounty(parse.string($tr.find('td:first-child').text()));
        const cases = parse.number($tr.find('td:nth-child(2)').text());
        counties.push({
          county,
          cases
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'LA',
    country: 'USA',
    _countyMap: {
      'La Salle Parish': 'LaSalle Parish'
    },
    aggregate: 'county',
    async scraper() {
      const counties = [];
      if (datetime.scrapeDateIsBefore('2020-3-14')) {
        this.url = 'http://ldh.la.gov/Coronavirus/';
        this.type = 'table';

        const $ = await fetch.page(this.url);

        const $table = $('p:contains("Louisiana Cases")').nextAll('table');

        const $trs = $table.find('tbody > tr:not(:last-child)');

        $trs.each((index, tr) => {
          // First 3 rows are test data
          if (index < 3) {
            return;
          }
          const $tr = $(tr);
          const county = `${parse.string($tr.find(`td:nth-last-child(2)`).text())} Parish`;

          // Skip bunk data
          const $tds = $tr.find('td');
          if ($tds.get(0).length > 2 && !$tds.first().attr('rowspan')) {
            return;
          }

          const cases = parse.number($tr.find('td:last-child').text());
          counties.push({
            county: this._countyMap[county] || county,
            cases
          });
        });
      } else {
        this.url = 'https://opendata.arcgis.com/datasets/cba425c2e5b8421c88827dc0ec8c663b_0.csv';
        this.type = 'csv';

        // Use the new map
        const data = await fetch.csv(this.url);

        for (const county of data) {
          if (county.PARISH === 'Out of State Resident') {
            continue;
          }
          if (county.PARISH === 'Parish Under Investigation') {
            continue;
          }
          const countyName = `${parse.string(county.PARISH)} Parish`;
          counties.push({
            county: this._countyMap[countyName] || countyName,
            cases: parse.number(county.Cases),
            deaths: parse.number(county.Deaths)
          });
        }
      }

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'IA',
    country: 'USA',
    url: 'https://idph.iowa.gov/emerging-health-issues/novel-coronavirus',
    type: 'table',
    aggregate: 'county',
    headless: true, // Incapsula blocking request
    async scraper() {
      const counties = [];
      const $ = await fetch.headless(this.url);
      const $table = $('caption:contains("Reported Cases in Iowa by County")').closest('table');

      const $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = transform.addCounty(
          $tr
            .find('td:first-child')
            .text()
            .replace(/[\d]*/g, '')
        );
        const cases = parse.number($tr.find('td:last-child').text());

        counties.push({
          county,
          cases
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'TX',
    country: 'USA',
    url: 'https://www.dshs.state.tx.us/news/updates.shtm',
    type: 'table',
    aggregate: 'county',
    ssl: false, // Error: unable to verify the first certificate
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);

      let $table;
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        $table = $('table[summary="Texas COVID-19 Cases"]');
      } else {
        $table = $('table[summary="COVID-19 Cases in Texas Counties"]');
      }

      const $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = transform.addCounty(
          $tr
            .find('td:first-child')
            .text()
            .replace(/[\d]*/g, '')
        );
        const cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county,
          cases
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'DE',
    country: 'USA',
    aggregate: 'county',
    async scraper() {
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        this.url = 'https://www.dhss.delaware.gov/dhss/dph/epi/2019novelcoronavirus.html';
        this.type = 'table';
        const $ = await fetch.page(this.url);

        const $td = $('*:contains("County breakdown")')
          .closest('tr')
          .find('td:last-child');

        const counties = $td
          .html()
          .split('<br>')
          .map(str => {
            const parts = str.split(': ');
            return {
              county: transform.addCounty(parse.string(parts[0])),
              cases: parse.number(parts[1])
            };
          });

        counties.push(transform.sumData(counties));

        return counties;
      }
      this.url = 'http://opendata.arcgis.com/datasets/c8d4efa2a6bd48a1a7ae074a8166c6fa_0.csv';
      this.type = 'csv';
      const data = await fetch.csv(this.url);

      // This CSV is probably going to change once they have confirmed data
      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.NAME),
          cases: parse.number(county.Presumptive_Positive),
          recovered: parse.number(county.Recovered)
        });
      }

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'FL',
    country: 'USA',
    priority: 1,
    aggregate: 'county',
    async scraper() {
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        this.type = 'table';
        this.url = 'http://www.floridahealth.gov/diseases-and-conditions/COVID-19/index.html';
        const counties = {};
        const $ = await fetch.page(this.url);

        const $table = $('*:contains("Diagnosed in Florida")').closest('table');

        const $trs = $table.find('tr');

        $trs.each((index, tr) => {
          if (index < 2) {
            return;
          }
          const $tr = $(tr);
          const county = transform.addCounty(parse.string($tr.find('td:nth-child(2)').text()));
          counties[county] = counties[county] || { cases: 0 };
          counties[county].cases += 1;
        });

        const countiesArray = transform.objectToArray(counties);

        // Add non florida as unassigned
        const text = $('div:contains("Non-Florida Residents")')
          .last()
          .text();
        const nonFlorida = text.split(' – ')[0];
        if (nonFlorida) {
          countiesArray.push({ name: UNASSIGNED, cases: nonFlorida });
        }

        countiesArray.push(transform.sumData(countiesArray));

        return countiesArray;
      }
      this.type = 'csv';
      this.url = 'https://opendata.arcgis.com/datasets/b4930af3f43a48138c70bca409b5c452_0.csv';
      const data = await fetch.csv(this.url);

      const counties = [];
      for (const county of data) {
        counties.push({
          county: parse.string(county.County),
          cases: parse.number(county.Counts)
        });
      }

      return counties;
    }
  },
  {
    state: 'NY',
    country: 'USA',
    url: 'https://www.health.ny.gov/diseases/communicable/coronavirus/',
    type: 'table',
    aggregate: 'county',
    _countyMap: {
      // This is totally wrong, but otherwise we need less granular GeoJSON
      'New York City': 'New York County',
      Broom: 'Broome'
    },
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);

      const $table = $('#case_count_table');

      const $trs = $table.find('tr:not(.total_row):not(:first-child)');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        let countyName = parse.string($tr.find('td:first-child').text()).replace(':', '');
        countyName = this._countyMap[countyName] || countyName;
        counties.push({
          county: transform.addCounty(countyName),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    state: 'WA',
    country: 'USA',
    url: 'https://www.doh.wa.gov/Emergencies/Coronavirus',
    type: 'table',
    headless: true,
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.headless(this.url);

      const $th = $('th:contains("(COVID-19) in Washington")');
      const $table = $th.closest('table');
      const $trs = $table.find('tbody > tr');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const cases = parse.number($tr.find('> *:nth-child(2)').text());
        const deaths = parse.number($tr.find('> *:last-child').text());
        let county = transform.addCounty(parse.string($tr.find('> *:first-child').text()));
        if (county === 'Unassigned County') {
          county = UNASSIGNED;
        }
        if (index < 1 || index > $trs.get().length - 2) {
          return;
        }
        counties.push({
          county,
          cases,
          deaths
        });
      });

      // Add unassigned
      counties.push(transform.sumData(counties));

      return counties;
    }
  },
  {
    county: 'San Francisco County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.sfdph.org/dph/alerts/coronavirus.asp',
    async scraper() {
      let deaths;
      let cases;
      const $ = await fetch.page(this.url);

      const $h2 = $('h2:contains("Cases in San Francisco")');

      {
        const $p = $h2.nextAll('*:contains("Cases:")');
        cases = parse.number($p.text());
      }

      {
        const $p = $h2.nextAll('*:contains("Deaths:")');
        deaths = parse.number($p.text());
      }

      return {
        cases,
        deaths
      };
    }
  },
  {
    county: 'San Mateo County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.smchealth.org/coronavirus',
    async scraper() {
      let deaths;
      let cases;
      const $ = await fetch.page(this.url);

      const $th = $('th:contains("COVID-19 Case Count")');
      const $table = $th.closest('table');

      {
        const $tr = $table.find('*:contains("Positive")').closest('tr');
        const $dataTd = $tr.find('td:last-child');
        cases = parse.number($dataTd.text());
      }

      {
        const $tr = $table.find('*:contains("Deaths")').closest('tr');
        const $dataTd = $tr.find('td:last-child');
        deaths = parse.number($dataTd.text());
      }

      return {
        cases,
        deaths
      };
    }
  },
  {
    county: 'Alameda County',
    state: 'CA',
    country: 'USA',
    // Error "Please enable JavaScript to view the page content."
    url: 'http://www.acphd.org/2019-ncov.aspx',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $table = $('.sccgov-responsive-table');

      return {
        deaths: parse.number(
          $table
            .find('div:contains("Deaths")')
            .parent()
            .children()
            .last()
            .text()
        ),
        cases: parse.number(
          $table
            .find('div:contains("Total Confirmed Cases")')
            .parent()
            .children()
            .last()
            .text()
        )
      };
    }
  },
  {
    county: 'Sonoma County',
    state: 'CA',
    country: 'USA',
    url: 'https://socoemergency.org/emergency/novel-coronavirus/novel-coronavirus-in-sonoma-county/',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $th = $('th:contains("Total in Sonoma County")');
      const $table = $th.closest('table');

      const $td = $table.find('td:last-child');
      const cases = parse.number($td.text());

      return {
        cases
      };
    }
  },
  {
    county: 'Santa Cruz County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.santacruzhealth.org/HSAHome/HSADivisions/PublicHealth/CommunicableDiseaseControl/Coronavirus.aspx',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $h2 = $('p:contains("Total Confirmed Cases")').nextAll('h2');

      const cases = parse.number($h2.text());

      return {
        cases
      };
    }
  },
  {
    county: 'Santa Clara County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.sccgov.org/sites/phd/DiseaseInformation/novel-coronavirus/Pages/home.aspx',

    async scraper() {
      // Santa Clara County uses JavaScript to parse JSON data into an HTML table. We cannot read
      // this table directly without the DOM so we regex parse the JSON data.

      const $ = await fetch.page(this.url);
      const scriptData = $('script:contains("Total_Confirmed_Cases")')[0].children[0].data;

      const regExp = /\[.*\]/;
      const data = JSON.parse(regExp.exec(scriptData))[0];

      const cases = parse.number(data.Total_Confirmed_Cases);
      const deaths = parse.number(data.Deaths);

      return {
        cases,
        deaths
      };
    }
  },
  {
    county: 'Solano County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.solanocounty.com/depts/ph/coronavirus.asp',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $el = $('*:contains("Number of Positive Cases")').first();

      const matches = $el.text().match(/Number of Positive Cases in Solano County: (\d)/);

      return {
        cases: parse.number(matches[1])
      };
    }
  },
  {
    county: 'Contra Costa County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.coronavirus.cchealth.org/',
    async scraper() {
      const $ = await fetch.headless(this.url);

      const cases = parse.number(
        $('h1:contains("TOTAL")')
          .parent()
          .next()
          .text()
      );
      const deaths = parse.number(
        $('h1:contains("DEATHS")')
          .parent()
          .prev()
          .text()
      );

      return {
        cases,
        deaths
      };
    }
  },
  {
    county: 'Stanislaus County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
    async scraper() {
      const $ = await fetch.page(this.url);

      return {
        cases: parse.number($('.counter').text())
      };
    }
  },
  {
    county: 'Yolo County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.yolocounty.org/health-human-services/adults/communicable-disease-investigation-and-control/novel-coronavirus-2019',
    async scraper() {
      const $ = await fetch.page(this.url);

      // this is brittle as all hell
      const $h3 = $('h3:contains("confirmed case")');

      const matches = $h3.text().match(/there are (\d+) confirmed cases? in Yolo/);
      return {
        cases: parse.number(matches[1])
      };
    }
  },
  {
    county: 'Sacramento County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.saccounty.net/COVID-19/Pages/default.aspx',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $table = $('th:contains("Confirmed")').closest('table');
      const $tds = $table.find('tr:last-child > td');
      return {
        cases: parse.number($tds.first().text()),
        deaths: parse.number($tds.last().text())
      };
    }
  },
  {
    county: 'Fresno County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.co.fresno.ca.us/departments/public-health/covid-19',
    async scraper() {
      const $ = await fetch.page(this.url);

      return {
        cases: parse.number($('li:contains("Total cases")').text()),
        deaths: parse.number($('li:contains("Total deaths")').text())
      };
    }
  },
  {
    county: 'Madera County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.maderacounty.com/government/public-health/health-updates/corona-virus',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $el = $('*:contains("Confirmed cases")').first();

      const matches = $el.text().match(/Confirmed cases:.*?(\d)/);

      return {
        cases: parse.number(matches[1])
      };
    }
  },
  {
    county: 'Placer County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.placer.ca.gov/6448/Cases-in-Placer',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $table = $('p:contains("Confirmed COVID-19 Cases in Placer County")')
        .nextAll('table')
        .first();
      return {
        cases: parse.number(
          $table
            .find('td:contains("Positive Tests")')
            .closest('tr')
            .find('td:last-child')
            .text()
        ),
        deaths: parse.number(
          $table
            .find('td:contains("Deaths")')
            .closest('tr')
            .find('td:last-child')
            .text()
        )
      };
    }
  },
  {
    county: 'Shasta County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.co.shasta.ca.us/index/hhsa/health-safety/current-heath-concerns/coronavirus',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $el = $('h3:contains("Positive cases:")').first();

      const matches = $el.text().match(/Positive cases:.*?(\d)/);

      return {
        cases: parse.number(matches[1])
      };
    }
  },
  {
    county: 'Los Angeles County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.publichealth.lacounty.gov/media/Coronavirus/',
    async scraper() {
      const $ = await fetch.page(this.url);

      return {
        cases: parse.number(
          $('.counter')
            .first()
            .text()
        ),
        deaths: parse.number(
          $('.counter')
            .last()
            .text()
        )
      };
    }
  },
  {
    county: 'San Bernardino County',
    state: 'CA',
    country: 'USA',
    url: 'http://wp.sbcounty.gov/dph/coronavirus/',
    async scraper() {
      const $ = await fetch.page(this.url);

      const cases = parse.number(
        $('h3:contains("COVID-19 CASES")')
          .parent()
          .attr('data-number-value')
      );

      return {
        cases
      };
    }
  },
  {
    county: 'San Joaquin County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.sjcphs.org/coronavirus.aspx#res',
    async scraper() {
      const $ = await fetch.page(this.url);

      const h3 = $('h6:contains("confirmed cases of COVID-19")')
        .first()
        .text();
      const cases = parse.number(h3.match(/\((\d+)\)/)[1]);

      return {
        cases
      };
    }
  },
  {
    county: 'Merced County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.co.merced.ca.us/3350/Coronavirus-Disease-2019',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $table = $('h3:contains("Merced County COVID-19 Statistics")')
        .parent()
        .next('table');

      const cases = parse.number(
        $table
          .find('td:contains("Cases")')
          .next('td')
          .text()
      );
      const deaths = parse.number(
        $table
          .find('td:contains("Deaths")')
          .next('td')
          .text()
      );
      const recovered = parse.number(
        $table
          .find('td:contains("Recoveries")')
          .next('td')
          .text()
      );

      return {
        cases,
        deaths,
        recovered
      };
    }
  },
  {
    county: 'Marin County',
    state: 'CA',
    country: 'USA',
    url: 'https://coronavirus.marinhhs.org/surveillance',
    async scraper() {
      const $ = await fetch.page(this.url);

      // This may be hacky but hopefully they keep the same formatting. We may need
      // to convert this to a table one available.
      const text = $('td:contains("confirmed cases of COVID-19")').text();

      const cases = parse.number(text.match(/there have been (\d+) confirmed cases of/)[1]);

      return {
        cases
      };
    }
  },
  {
    county: 'Butte County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.buttecounty.net/publichealth',
    async scraper() {
      const $ = await fetch.page(this.url);

      // This may be hacky but hopefully they keep the same formatting. We may need
      // to convert this to a table one available.
      const cases = parse.number(
        $('td:contains("Positive COVID-19 Tests")')
          .next()
          .text()
      );

      return {
        cases
      };
    }
  },
  {
    county: 'Calaveras County',
    state: 'CA',
    country: 'USA',
    url: 'https://covid19.calaverasgov.us/',
    async scraper() {
      const $ = await fetch.page(this.url);

      const cases = parse.number(
        $('h2:contains("in Calaveras County:")')
          .first()
          .text()
          .match(/in Calaveras County: (\d+)/)[1]
      );

      return {
        cases
      };
    }
  },
  {
    county: 'Colusa County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.countyofcolusa.org/99/Public-Health',
    async scraper() {
      const $ = await fetch.page(this.url);

      const cases = parse.number(
        $('strong:contains("Confirmed Cases:")')
          .first()
          .text()
          .match(/Confirmed Cases: (\d+)/)[1]
      );

      return {
        cases
      };
    }
  },
  {
    county: 'Del Norte County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.co.del-norte.ca.us/departments/health-human-services/public-health',
    async scraper() {
      const $ = await fetch.page(this.url);

      const cases = parse.number(
        $('font:contains("Number of Confirmed Cases")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );

      const pui = parse.number(
        $('font:contains("Number of Persons Under Investigation")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );

      const pending = parse.number(
        $('font:contains("Number of Specimens with Results Pending")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );

      const negative = parse.number(
        $('font:contains("Number of Negative Tests")')
          .first()
          .text()
          .match(/(\d+)/)[1]
      );

      const tested = pui + pending + negative;

      return {
        cases,
        tested
      };
    }
  },
  {
    county: 'Glenn County',
    state: 'CA',
    country: 'USA',
    async scraper() {
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        this.url = 'https://www.countyofglenn.net/dept/health-human-services/public-health/welcome';
      } else {
        this.url = 'https://www.countyofglenn.net/dept/health-human-services/public-health/covid-19';
      }

      const $ = await fetch.page(this.url);

      // Resource contains multiple updates shown chronologically however it is unclear now that
      // they will follow any reliable pattern. This captures the first one as the latest

      const cases = parse.number(
        $('font:contains("Glenn County COVID-19 Cases")')
          .first()
          .text()
          .match(/Cases: (\d+)/)[1]
      );

      return {
        cases
      };
    }
  },
  {
    county: 'Kings County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.countyofkings.com/departments/health-welfare/public-health/coronavirus-disease-2019-covid-19/-fsiteid-1',
    async scraper() {
      const $ = await fetch.page(this.url);

      const cases = parse.number(
        $('h3:contains("Confirmed Cases")')
          .text()
          .match(/Confirmed Cases: (\d+)/)[1]
      );

      return {
        cases
      };
    }
  },
  {
    county: 'Mendocino County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.mendocinocounty.org/community/novel-coronavirus',
    async scraper() {
      const $ = await fetch.page(this.url);

      const cases = parse.number(
        $('strong:contains("current cases of COVID-19")')
          .text()
          .match(/There are (\d+) current cases of/)[1]
      );

      return {
        cases
      };
    }
  },
  {
    county: 'Orange County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.ochealthinfo.com/phs/about/epidasmt/epi/dip/prevention/novel_coronavirus',
    async scraper() {
      const $ = await fetch.page(this.url);

      return {
        cases: parse.number(
          $('td:contains("Cases")')
            .next()
            .text()
        ),
        deaths: parse.number(
          $('td:contains("Total Deaths")')
            .next()
            .text()
        )
      };
    }
  },
  {
    county: 'Riverside County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.rivcoph.org/coronavirus',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $el = $('p:contains("Confirmed cases:")').first();

      const matches = $el.text().match(/Confirmed cases:.*?(\d)/);

      return {
        cases: parse.number(matches[1])
      };
    }
  },
  {
    county: 'Mono County',
    state: 'CA',
    country: 'USA',
    url: 'https://monocovid19-monomammoth.hub.arcgis.com/',
    async scraper() {
      const $ = await fetch.headless(this.url);

      const cases = parse.number(
        $('h4:contains("POSITIVE")')
          .first()
          .parent()
          .next('h3')
          .text()
      );

      return {
        cases
      };
    }
  },
  {
    county: 'San Diego County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
    async scraper() {
      const $ = await fetch.page(this.url);

      let cases = 0;
      $('td:contains("Positive (confirmed cases)")')
        .nextAll('td')
        .each((index, td) => {
          cases += parse.number($(td).text());
        });

      $('td:contains("Presumptive Positive")')
        .nextAll('td')
        .each((index, td) => {
          cases += parse.number($(td).text());
        });

      return {
        cases,
        tested: parse.number(
          $('td:contains("Total Tested")')
            .next('td')
            .text()
        )
      };
    }
  },
  {
    county: 'Ventura County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.ventura.org/covid19/',
    type: 'paragraph', // It's not a real table, it gets a low score
    async scraper() {
      const $ = await fetch.headless(this.url);

      let cases = 0;
      let tested = 0;

      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        cases += parse.number(
          $('.count-subject:contains("Positive travel-related case")')
            .closest('.hb-counter')
            .find('.count-number')
            .attr('data-from')
        );
        cases += parse.number(
          $('.count-subject:contains("Presumptive Positive")')
            .closest('.hb-counter')
            .find('.count-number')
            .attr('data-from')
        );
        tested = parse.number(
          $('.count-subject:contains("People tested")')
            .closest('.hb-counter')
            .find('.count-number')
            .attr('data-from')
        );
      } else {
        cases += parse.number(
          $('td:contains("Positive cases")')
            .closest('table')
            .find('td')
            .first()
            .text()
        );
        cases += parse.number(
          $('td:contains("Presumptive positive")')
            .closest('table')
            .find('td')
            .first()
            .text()
        );

        tested = parse.number(
          $('td:contains("People tested")')
            .closest('table')
            .find('td')
            .first()
            .text()
        );
      }

      return {
        cases,
        tested
      };
    }
  },
  {
    state: 'WI',
    country: 'USA',
    url: 'https://www.dhs.wisconsin.gov/outbreaks/index.htm',
    type: 'table',
    aggregate: 'county',
    async scraper() {
      const regions = [];
      const $ = await fetch.page(this.url);

      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        const $table = $('caption:contains("Number of Positive Results by County")').closest('table');
        const $trs = $table.find('tbody > tr:not(:last-child)');
        $trs.each((index, tr) => {
          const $tr = $(tr);
          regions.push({
            county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:last-child').text())
          });
        });

        regions.push(transform.sumData(regions));
      } else {
        const $table = $('h5:contains("Number of Positive Results by County")')
          .nextAll('table')
          .first();
        const $trs = $table.find('tbody > tr:not(:last-child)');
        $trs.each((index, tr) => {
          const $tr = $(tr);
          regions.push({
            county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:last-child').text())
          });
        });

        {
          // Get state data from other table
          const stateData = {
            tested: 0
          };

          const $table = $('h5:contains("Wisconsin COVID-19 Test Results")')
            .nextAll('table')
            .first();
          const $trs = $table.find('tbody > tr');
          $trs.each((index, tr) => {
            const $tr = $(tr);
            const label = parse.string($tr.find('td:first-child').text());
            const value = parse.number($tr.find('td:last-child').text());
            if (label === 'Positive') {
              stateData.cases = value;
              stateData.tested += value;
            } else if (label === 'Negative') {
              stateData.tested += value;
            }
          });

          regions.push(stateData);
        }
      }

      return regions;
    }
  },
  {
    state: 'SD',
    country: 'USA',
    url: 'https://doh.sd.gov/news/Coronavirus.aspx#SD',
    type: 'table',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);
      const $th = $('h2:contains("South Dakota Counties with COVID-19 Cases")');
      const $table = $th.next('table');
      const $trs = $table.find('tbody > tr');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        counties.push({
          county: transform.addCounty(parse.string($tr.find('> *:first-child').text())),
          cases: parse.number($tr.find('> *:last-child').text())
        });
      });
      return counties;
    }
  },
  {
    state: 'UT',
    country: 'USA',
    url: 'https://coronavirus.utah.gov/latest/',
    type: 'table',
    aggregate: 'county',
    async scraper() {
      const $ = await fetch.page(this.url);
      const counties = [];
      const $table = $('th:contains("District")').closest('table');
      const $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = parse.string($tr.find('td:first-child').text());
        const cases = parse.number($tr.find('td:last-child').text());
        if (index > 0 && county.indexOf('Non-Utah') === -1) {
          counties.push({
            county: transform.addCounty(county),
            cases
          });
        }
      });
      return counties;
    }
  },
  {
    state: 'PA',
    country: 'USA',
    url: 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx',
    type: 'list',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        const $lis = $('li:contains("Counties impacted to date include")')
          .nextAll('ul')
          .first()
          .find('li');
        $lis.each((index, li) => {
          const matches = $(li)
            .text()
            .match(/([A-Za-z]+) \((\d+\))/);
          if (matches) {
            const county = transform.addCounty(parse.string(matches[1]));
            const cases = parse.number(matches[2]);
            counties.push({
              county,
              cases
            });
          }
        });
      } else {
        const $table = $('table.ms-rteTable-default').first();
        const $trs = $table.find('tbody > tr');

        $trs.each((index, tr) => {
          const $tr = $(tr);
          const data = {
            county: parse.string($tr.find('td:first-child').text()),
            cases: parse.number($tr.find('td:last-child').text())
          };
          counties.push(data);
        });
      }
      return counties;
    }
  },
  {
    state: 'TN',
    country: 'USA',
    url: 'https://www.tn.gov/health/cedep/ncov.html',
    type: 'table',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('th:contains("Case Count")').closest('table');

      const $trs = $table.find('tbody > tr');

      $trs.each((index, tr) => {
        if (index < 1) {
          return;
        }
        const $tr = $(tr);
        counties.push({
          county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      return counties;
    }
  },
  {
    state: 'OH',
    country: 'USA',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      let arrayOfCounties = [];
      if (datetime.scrapeDateIsBefore('2020-3-16')) {
        this.url = 'https://odh.ohio.gov/wps/portal/gov/odh/know-our-programs/Novel-Coronavirus/welcome/';
        const $ = await fetch.page(this.url);
        const $paragraph = $('p:contains("Number of counties with cases:")').text();
        const regExp = /\(([^)]+)\)/;
        const parsed = regExp.exec($paragraph);
        arrayOfCounties = parsed[1].split(',');
      } else {
        this.url = 'https://coronavirus.ohio.gov/wps/portal/gov/covid-19/';
        const $ = await fetch.page(this.url);
        const $paragraph = $('p:contains("Number of counties with cases:")').text();
        const parsed = $paragraph.replace(/([()])/g, '').replace('* Number of counties with cases: ', '');
        arrayOfCounties = parsed.split(',');
      }

      arrayOfCounties.forEach(county => {
        const splitCounty = county.trim().split(' ');
        counties.push({
          county: transform.addCounty(parse.string(splitCounty[0])),
          cases: parse.number(splitCounty[1])
        });
      });
      return counties;
    }
  },
  {
    state: 'CT',
    country: 'USA',
    url: 'https://portal.ct.gov/Coronavirus',
    type: 'list',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.page(this.url);
      const $lis = $('span:contains("Latest COVID-19 Testing Data in Connecticut")')
        .nextAll('ul')
        .first()
        .find('li');

      $lis.each((index, li) => {
        if (index < 1) {
          return;
        }
        const countyData = $(li)
          .text()
          .split(/:\s*/);
        counties.push({
          county: parse.string(countyData[0]),
          cases: parse.number(countyData[1])
        });
      });
      return counties;
    }
  },
  {
    county: 'San Benito County',
    state: 'CA',
    country: 'USA',
    url: 'https://hhsa.cosb.us/publichealth/communicable-disease/coronavirus/',
    async scraper() {
      const $ = await fetch.page(this.url);

      const $table = $('h1:contains("San Benito County COVID-19 Case Count")')
        .nextAll('table')
        .first();

      return {
        cases: parse.number(
          $table
            .find('td:contains("Positive")')
            .next('td')
            .text()
        ),
        deaths: parse.number(
          $table
            .find('td:contains("Deaths")')
            .next('td')
            .text()
        ),
        recovered: parse.number(
          $table
            .find('td:contains("Recovered")')
            .next('td')
            .text()
        )
      };
    }
  },
  {
    country: 'FRA',
    url: 'https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv',
    timeseries: true,
    priority: 1,
    aggregate: 'state',
    async scraper() {
      const data = await fetch.csv(this.url, false);
      const states = [];

      let date = datetime.getYYYYMMDD();
      if (process.env.SCRAPE_DATE) {
        date = datetime.getYYYYMMDD(new Date(process.env.SCRAPE_DATE));
      }
      for (const row of data) {
        const granularity = row.granularite !== undefined ? parse.string(row.granularite) : '';
        const rowDate = row.date !== undefined ? parse.string(row.date) : '';
        if ((granularity === 'region' || granularity === 'collectivite-outremer') && rowDate === date) {
          const state = row.maille_nom !== undefined ? parse.string(row.maille_nom) : '';
          const cases = row.cas_confirmes !== undefined ? parse.number(row.cas_confirmes) : 0;
          const deaths = row.deces !== undefined ? parse.number(row.deces) : 0;
          let sourceUrl = row.source_url !== undefined ? parse.string(row.source_url) : this.url;
          sourceUrl = sourceUrl === '' ? this.url : sourceUrl;
          if (state !== '') {
            const data = {
              state,
              cases,
              deaths,
              url: sourceUrl
            };
            if (rules.isAcceptable(data, null, null)) {
              states.push(data);
            }
          }
        }
      }

      // Add data for FRA
      states.push(transform.sumData(states));

      return states;
    }
  },
  {
    country: 'ESP',
    url: 'https://opendata.arcgis.com/datasets/48fac2d7de0f43f9af938852e3748845_0.csv',
    priority: 1,
    aggregate: 'state',
    async scraper() {
      const data = await fetch.csv(this.url);
      const states = [];
      for (const row of data) {
        const state = row.Texto !== undefined ? parse.string(row.Texto) : '';
        const cases = row.TotalConfirmados !== undefined ? parse.number(row.TotalConfirmados) : 0;
        const deaths = row.TotalFallecidos !== undefined ? parse.number(row.TotalFallecidos) : 0;
        const recovered = row.TotalRecuperados !== undefined ? parse.number(row.TotalRecuperados) : 0;
        if (state !== '') {
          const data = {
            state,
            cases,
            deaths,
            recovered
          };
          if (rules.isAcceptable(data, null, this._reject)) {
            states.push(data);
          }
        }
      }
      // Add data for ESP
      states.push(transform.sumData(states));

      return states;
    }
  },
  {
    state: 'MD',
    country: 'USA',
    url: 'https://coronavirus.maryland.gov/',
    aggregate: 'county',
    async scraper() {
      const counties = [];
      const $ = await fetch.headless(this.url);
      const paragraph = $('p:contains("Number of Confirmed Cases:")')
        .next('p')
        .text();

      paragraph.split(')').forEach(splitCounty => {
        if (splitCounty.length > 1) {
          let county = parse.string(splitCounty.substring(0, splitCounty.indexOf('(')).trim());
          // check for Baltimore City
          if (county !== 'Baltimore City') {
            county = transform.addCounty(county);
          }
          const cases = parse.number(splitCounty.substring(splitCounty.indexOf('(') + 1, splitCounty.length).trim());
          counties.push({
            county,
            cases
          });
        }
      });
      return counties;
    }
  },
  {
    country: 'AUS',
    url: 'https://www.health.gov.au/news/health-alerts/novel-coronavirus-2019-ncov-health-alert/coronavirus-covid-19-current-situation-and-case-numbers',
    type: 'table',
    priority: 1,
    aggregate: 'state',
    async scraper() {
      const states = [];
      const $ = await fetch.page(this.url);

      const $table = $('.health-table__responsive > table');

      const $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        const state = parse.string($tr.find('td:first-child').text());
        const cases = parse.number($tr.find('td:nth-child(2)').text());
        states.push({
          state,
          cases
        });
      });

      // Add data for AUS itself
      states.push(transform.sumData(states));

      return states;
    }
  }
];

export default scrapers;
