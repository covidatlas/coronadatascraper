import * as fetch from './lib/fetch.js';
import * as parse from './lib/parse.js';
import * as transform from './lib/transform.js';
import * as rules from './lib/rules.js';

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

let scrapers = [
  {
    url: 'https://opendata.arcgis.com/datasets/d14de7e28b0448ab82eb36d6f25b1ea1_0.csv',
    country: 'USA',
    state: 'IN',
    scraper: async function() {
      let data = await fetch.csv(this.url);

      let counties = [];
      for (let county of data) {
        counties.push({
          county: parse.string(county.COUNTYNAME) + ' County',
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
    scraper: async function() {
      let data = await fetch.csv(this.url);

      let counties = [];
      for (let county of data) {
        counties.push({
          county: parse.string(county.County) + ' County',
          cases: parse.number(county.Total), // Includes presumptive
          recovered: parse.number(county.Recovered),
          deaths: parse.number(county.Deaths)
        });
      }

      return counties;
    }
  },
  {
    url: 'https://opendata.arcgis.com/datasets/8840fd8ac1314f5188e6cf98b525321c_0.csv',
    country: 'USA',
    state: 'NJ',
    scraper: async function() {
      let data = await fetch.csv(this.url);

      let counties = [];
      for (let county of data) {
        counties.push({
          county: parse.string(county.COUNTY_LAB),
          cases: parse.number(county.Positives),
          tested: parse.number(county.Negatives) + parse.number(county.Positives)
        });
      }

      return counties;
    }
  },
  {
    country: 'Canada',
    url: 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html',
    _reject: [
      {
        state: 'Repatriated travellers'
      },
      {
        state: 'Total cases'
      }
    ],
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $table = $('h2:contains("Current situation")')
        .nextAll('table')
        .first();

      let $trs = $table.find('tbody > tr');

      let regions = [];

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let data = {
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
    _urls: {
      cases: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
      deaths: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
      recovered: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'
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
    scraper: async function() {
      let cases = await fetch.csv(this._urls.cases, false);
      let deaths = await fetch.csv(this._urls.deaths, false);
      let recovered = await fetch.csv(this._urls.recovered, false);

      let countries = [];
      let latestDate = Object.keys(cases[0]).pop();

      if (process.env['SCRAPE_DATE']) {
        // Find old date
        latestDate = transform.getMDYY(new Date(process.env['SCRAPE_DATE']));
      }

      for (let index = 0; index < cases.length; index++) {
        if (rules.isAcceptable(cases[index], this._accept, this._reject)) {
          countries.push({
            country: parse.string(cases[index]['Country/Region']),
            state: parse.string(cases[index]['Province/State']),
            cases: parse.number(cases[index][latestDate] || 0),
            recovered: parse.number(recovered[index][latestDate] || 0),
            deaths: parse.number(deaths[index][latestDate] || 0),
            coordinates: [parse.float(cases[index]['Long']), parse.float(cases[index]['Lat'])]
          });
        }
      }

      return countries;
    }
  },
  {
    country: 'USA',
    url: 'https://www.cdc.gov/coronavirus/2019-ncov/map-data-cases.csv',
    _getCaseNumber: function(string) {
      if (typeof string === 'string') {
        let matches;
        if (string === 'None') {
          return 0;
        }
        if ((matches = string.match(/(\d+) of (\d+)/))) {
          // Return the high number
          return parse.number(matches[2]);
        }
        else {
          return parse.number(string);
        }
      }
      return string;
    },
    scraper: async function() {
      let data = await fetch.csv(this.url);

      let states = [];
      for (let stateData of data) {
        if (stateData.Name) {
          states.push({
            state: parse.string(stateData.Name),
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
    scraper: async function() {
      let data = await fetch.csv(this.url, false);

      let latestData;
      if (process.env['SCRAPE_DATE']) {
        // Find old date
        let date = transform.getDDMMYYYY(new Date(process.env['SCRAPE_DATE']), '.');
        latestData = data.filter(dayData => dayData.Date === date)[0];
      }
      else {
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
    scraper: async function() {
      let data = await fetch.csv(this.url, false);

      let latestDate = data[data.length - 1].data.substr(0, 10);
      if (process.env['SCRAPE_DATE']) {
        // Find old date
        latestDate = transform.getYYYYMMDD(new Date(process.env['SCRAPE_DATE']), '-');
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
    state: 'MS',
    country: 'USA',
    url: 'https://msdh.ms.gov/msdhsite/_static/14,0,420.html',
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $table = $('h3:contains("Mississippi Cases")')
        .nextAll('table')
        .first();

      let $trs = $table.find('tbody > tr');

      let counties = {};

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let status = $tr.find('td:nth-child(3)').text();
        let county = parse.string($tr.find('td:nth-child(2)').text()) + ' County';

        // Make sure this matches once they have a confirmed case
        if (status === 'Confirmed') {
          counties[county] = counties[county] || { cases: 0 };
          counties[county].cases++;
        }
      });

      return transform.objectToArray(counties);
    }
  },
  {
    state: 'DC',
    country: 'USA',
    url: 'https://coronavirus.dc.gov/page/coronavirus-data',
    scraper: async function() {
      let $ = await fetch.page(this.url);

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
        cases: cases,
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
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $table = $('td:contains("(COVID-19) in Alabama")').closest('table');

      // Ignore the last row "Out of town"
      let $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        let $tr = $(tr);
        counties.push({
          county: parse.string($tr.find('td:first-child').text()) + ' County',
          cases: parse.number($tr.find('td:nth-last-child(2)').text()),
          deaths: parse.number($tr.find('td:last-child').text())
        });
      });

      return counties;
    }
  },
  {
    state: 'CO',
    country: 'USA',
    url: 'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub',
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $lis = $('p:contains("Presumptive positive cases by county of residence")')
        .nextAll('ul')
        .first()
        .find('li');

      $lis.each((index, li) => {
        // This does not match "Out of state visitors"
        let matches = $(li)
          .text()
          .match(/(.*?): (\d+)/);
        if (matches) {
          counties.push({
            county: transform.addCounty(parse.string(matches[1])),
            cases: parse.number(matches[2])
          });
        }
      });

      return counties;
    }
  },
  {
    state: 'OR',
    country: 'USA',
    url: 'https://www.oregon.gov/oha/PH/DISEASESCONDITIONS/DISEASESAZ/Pages/emerging-respiratory-infections.aspx',
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $table = $('table[summary="Cases by County in Oregon for COVID-19"]');

      let $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county = parse.string($tr.find('td:first-child').text()) + ' County';
        let cases = parse.number($tr.find('td:nth-child(2)').text());
        counties.push({
          county: county,
          cases: cases
        });
      });

      return counties;
    }
  },
  {
    state: 'LA',
    country: 'USA',
    url: 'http://ldh.la.gov/Coronavirus/',
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $table = $('p:contains("Louisiana Cases")').nextAll('table');

      let $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        // First 3 rows are test data
        if (index < 3) {
          return;
        }
        let $tr = $(tr);
        let county = parse.string($tr.find(`td:nth-last-child(2)`).text()) + ' Parish';

        // Skip bunk data
        let $tds = $tr.find('td');
        if ($tds.get(0).length > 2 && !$tds.first().attr('rowspan')) {
          return;
        }

        let cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county: county,
          cases: cases
        });
      });

      return counties;
    }
  },
  {
    state: 'IA',
    country: 'USA',
    url: 'https://idph.iowa.gov/emerging-health-issues/novel-coronavirus',
    // Incapsula blocking request
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $table = $('caption:contains("Reported Cases in Iowa by County")').closest('table');

      let $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county =
          $tr
            .find('td:first-child')
            .text()
            .replace(/[\d]*/g, '') + ' County';
        let cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county: county,
          cases: cases
        });
      });

      return counties;
    }
  },
  {
    state: 'TX',
    country: 'USA',
    url: 'https://www.dshs.state.tx.us/news/updates.shtm',
    // Error: unable to verify the first certificate
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $table = $('table[summary="Texas COVID-19 Cases"]');

      let $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county =
          $tr
            .find('td:first-child')
            .text()
            .replace(/[\d]*/g, '') + ' County';
        let cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county: county,
          cases: cases
        });
      });

      return counties;
    }
  },
  {
    state: 'DE',
    country: 'USA',
    url: 'https://www.dhss.delaware.gov/dhss/dph/epi/2019novelcoronavirus.html',
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $td = $('*:contains("County breakdown")')
        .closest('tr')
        .find('td:last-child');

      let counties = $td
        .html()
        .split('<br>')
        .map(str => {
          let parts = str.split(': ');
          return {
            county: parts[0] + ' County',
            cases: parse.number(parts[1])
          };
        });

      return counties;
    }
  },
  {
    state: 'FL',
    country: 'USA',
    url: 'http://www.floridahealth.gov/diseases-and-conditions/COVID-19/index.html',
    scraper: async function() {
      let counties = {};
      let $ = await fetch.page(this.url);

      let $table = $('*:contains("Diagnosed in Florida")').closest('table');

      let $trs = $table.find('tr');

      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        let $tr = $(tr);
        let county = parse.string($tr.find('td:nth-child(2)').text()) + ' County';
        counties[county] = counties[county] || { cases: 0 };
        counties[county].cases += 1;
      });

      return transform.objectToArray(counties);
    }
  },
  {
    state: 'NY',
    country: 'USA',
    url: 'https://www.health.ny.gov/diseases/communicable/coronavirus/',
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $table = $('#case_count_table');

      let $trs = $table.find('tr:not(.total_row):not(:first-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county = parse.string($tr.find('td:first-child').text()).replace(':', '');
        let cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county: county,
          cases: cases
        });
      });

      return counties;
    }
  },
  {
    state: 'WA',
    country: 'USA',
    url: 'https://www.doh.wa.gov/Emergencies/Coronavirus',
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $th = $('th:contains("(COVID-19) in Washington")');
      let $table = $th.closest('table');
      let $trs = $table.find('tbody > tr');

      $trs.each((index, tr) => {
        if (index < 1 || index > $trs.get().length - 3) {
          return;
        }
        let $tr = $(tr);
        counties.push({
          county: parse.string($tr.find('> *:first-child').text()) + ' County',
          cases: parse.number($tr.find('> *:nth-child(2)').text()),
          deaths: parse.number($tr.find('> *:last-child').text())
        });
      });

      return counties;
    }
  },
  {
    county: 'San Francisco County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.sfdph.org/dph/alerts/coronavirus.asp',
    scraper: async function() {
      let deaths, cases;
      let $ = await fetch.page(this.url);

      let $h2 = $('h2:contains("Cases in San Francisco")');

      {
        let $p = $h2.nextAll('*:contains("Cases:")');
        cases = parse.number($p.text());
      }

      {
        let $p = $h2.nextAll('*:contains("Deaths:")');
        deaths = parse.number($p.text());
      }

      return {
        cases: cases,
        deaths: deaths
      };
    }
  },
  {
    county: 'San Mateo County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.smchealth.org/coronavirus',
    scraper: async function() {
      let deaths, cases;
      let $ = await fetch.page(this.url);

      let $th = $('th:contains("COVID-19 Case Count")');
      let $table = $th.closest('table');

      {
        let $tr = $table.find('*:contains("Positive")').closest('tr');
        let $dataTd = $tr.find('td:last-child');
        cases = parse.number($dataTd.text());
      }

      {
        let $tr = $table.find('*:contains("Deaths")').closest('tr');
        let $dataTd = $tr.find('td:last-child');
        deaths = parse.number($dataTd.text());
      }

      return {
        cases: cases,
        deaths: deaths
      };
    }
  },
  {
    county: 'Alameda County',
    state: 'CA',
    country: 'USA',
    // Error "Please enable JavaScript to view the page content."
    url: 'http://www.acphd.org/2019-ncov.aspx',
    scraper: async function() {
      let cases;
      let $ = await fetch.page(this.url);

      let $table = $('.sccgov-responsive-table');

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
    scraper: async function() {
      let cases;
      let $ = await fetch.page(this.url);

      let $th = $('th:contains("Total in Sonoma County")');
      let $table = $th.closest('table');

      let $td = $table.find('td:last-child');
      cases = parse.number($td.text());

      return {
        cases: cases
      };
    }
  },
  {
    county: 'Santa Cruz County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.santacruzhealth.org/HSAHome/HSADivisions/PublicHealth/CommunicableDiseaseControl/Coronavirus.aspx',
    scraper: async function() {
      let cases;
      let $ = await fetch.page(this.url);

      let $h1 = $('p:contains("Total Confirmed Cases")').nextAll('h1');

      cases = parse.number($h1.text());

      return {
        cases: cases
      };
    }
  },
  {
    county: 'Santa Clara County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.sccgov.org/sites/phd/DiseaseInformation/novel-coronavirus/Pages/home.aspx',
    // Error: page needs JavaScript
    _scraper: async function() {
      let cases;
      let $ = await fetch.page(this.url);

      let $table = $('.sccgov-responsive-table');

      let $cell = $table.find('.sccgov-responsive-table-cell').first();
      cases = parse.number($cell.text());

      return {
        cases: cases
      };
    }
  },
  {
    county: 'Solano County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.solanocounty.com/depts/ph/coronavirus.asp',
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $el = $('*:contains("Number of Positive Cases")').first();

      let matches = $el.text().match(/Number of Positive Cases in Solano County: (\d)/);

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
    scraper: async function() {
      let cases, deaths;
      let $ = await fetch.page(this.url);

      cases = parse.number(
        $('h1:contains("TOTAL")')
          .parent()
          .next()
          .text()
      );
      deaths = parse.number(
        $('h1:contains("DEATHS")')
          .parent()
          .prev()
          .text()
      );

      return {
        cases: cases,
        deaths: deaths
      };
    }
  },
  {
    county: 'Stanislaus County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
    scraper: async function() {
      let $ = await fetch.page(this.url);

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
    scraper: async function() {
      let $ = await fetch.page(this.url);

      // this is brittle as all hell
      let $h3 = $('h3:contains("confirmed case")');

      let matches = $h3.text().match(/there are (\d+) confirmed cases? in Yolo/);
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
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $table = $('th:contains("Confirmed")').closest('table');
      let $tds = $table.find('tr:last-child > td');
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
    scraper: async function() {
      let $ = await fetch.page(this.url);

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
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $el = $('*:contains("Confirmed cases")').first();

      let matches = $el.text().match(/Confirmed cases:.*?(\d)/);

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
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $table = $('p:contains("Confirmed COVID-19 Cases in Placer County")')
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
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $el = $('h3:contains("Positive cases:")').first();

      let matches = $el.text().match(/Positive cases:.*?(\d)/);

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
    scraper: async function() {
      let $ = await fetch.page(this.url);

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
    county: 'Orange County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.ochealthinfo.com/phs/about/epidasmt/epi/dip/prevention/novel_coronavirus',
    scraper: async function() {
      let $ = await fetch.page(this.url);

      return {
        cases: parse.number(
          $('td:contains("Confirmed Cases")')
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
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let $el = $('p:contains("Confirmed cases:")').first();

      let matches = $el.text().match(/Confirmed cases:.*?(\d)/);

      return {
        cases: parse.number(matches[1])
      };
    }
  },
  {
    county: 'San Diego County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
    scraper: async function() {
      let $ = await fetch.page(this.url);

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
        cases: cases,
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
    // Needs JavaScript to populate counts
    scraper: async function() {
      let $ = await fetch.page(this.url);

      let cases = 0;
      cases += parse.number(
        $('.count-subject:contains("Positive travel-related case")')
          .closest('.hb-counter')
          .find('.count-number')
          .text()
      );
      cases += parse.number(
        $('.count-subject:contains("Presumptive Positive")')
          .closest('.hb-counter')
          .find('.count-number')
          .text()
      );

      return {
        cases: cases,
        tested: parse.number(
          $('.count-subject:contains("People tested")')
            .closest('.hb-counter')
            .find('.count-number')
            .text()
        )
      };
    }
  },
  {
    state: 'WI',
    country: 'USA',
    url: 'https://www.dhs.wisconsin.gov/outbreaks/index.htm',
    scraper: async function() {
      let $ = await fetch.page(this.url);
      let counties = [];
      let $table = $('caption:contains("Number of Positive Results by County")').closest('table');
      let $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        let $tr = $(tr);
        counties.push({
          county: parse.string($tr.find('td:first-child').text()) + ' County',
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      return counties;
    }
  },
  {
    state: 'SD',
    country: 'USA',
    url: 'https://doh.sd.gov/news/Coronavirus.aspx#SD',
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);
      let $th = $('h2:contains("South Dakota Counties with COVID-19 Cases")');
      let $table = $th.next('table');
      let $trs = $table.find('tbody > tr');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        counties.push({
          county: parse.string($tr.find('> *:first-child').text()) + ' County',
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
    scraper: async function () {
      let $ = await fetch.page(this.url);
      let counties = [];
      let $table = $('th:contains("District")').closest('table');
      let $trs = $table.find('tbody > tr');
      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county = parse.string($tr.find('td:first-child').text());
        let cases = parse.number($tr.find('td:last-child').text());
        if (index > 0 && county.indexOf('Non-Utah') === -1) {
          counties.push({
            county: county + ' County',
            cases,
          });
        }
      });
      return counties
    }
  },
  {
    state: 'PA',
    country: 'USA',
    url: 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx',
    scraper: async function () {
      let counties = [];
      let $ = await fetch.page(this.url);
      let $lis = $('li:contains("Counties impacted to date include")').nextAll('ul').first().find('li');
      $lis.each((index, li) => {
        let matches = $(li).text().match(/([A-Za-z]+) \((\d+\))/);
        if (matches) {
          let county = parse.string(matches[1]) + ' County';
          let cases = parse.number(matches[2]);
          counties.push({
            county,
            cases,
          });
        }
      });
      return counties
    }
  },
];

export default scrapers;
