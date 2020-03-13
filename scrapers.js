import load from './lib/load.js';
import * as parse from './lib/parse.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    cases: Integer,
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }
*/

let scrapers = [
  {
    state: 'TX',
    country: 'USA',
    url: 'https://www.dshs.state.tx.us/news/updates.shtm',
    // Error: unable to verify the first certificate
    scraper: async function() {
      let counties = [];
      let $ = await load(this.url);

      let $table = $('table[summary="Texas COVID-19 Cases"]');

      let $trs = $table.find('tbody > tr:not(:last-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county = $tr.find('td:first-child').text().replace(/[\d]*/g, '');
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
      let counties = {};
      let $ = await load(this.url);

      let $td = $('*:contains("County breakdown")').closest('tr').find('td:last-child');

      let countyArray = $td.html().split('<br>').map((str) => {
        let parts = str.split(': ');
        return {
          county: parts[0] + ' County',
          cases: parse.number(parts[1])
        }
      });

      return countyArray;
    }
  },
  {
    state: 'FL',
    country: 'USA',
    url: 'http://www.floridahealth.gov/diseases-and-conditions/COVID-19/index.html',
    scraper: async function() {
      let counties = {};
      let $ = await load(this.url);

      let $table = $('*:contains("Diagnosed in Florida")').closest('table');

      let $trs = $table.find('tr:not(:first-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county = $tr.find('td:nth-child(2)').text();
        counties[county] = counties[county] || { cases: 0 };
        counties[county].cases += 1;
      });

      let countyArray = [];
      for (let [county, data] of Object.entries(counties)) {
        countyArray.push(Object.assign({
          county: county
        }, data));
      }

      return countyArray;
    }
  },
  {
    state: 'NY',
    country: 'USA',
    url: 'https://www.health.ny.gov/diseases/communicable/coronavirus/',
    scraper: async function() {
      let counties = [];
      let $ = await load(this.url);

      let $table = $('#case_count_table');

      let $trs = $table.find('tr:not(.total_row):not(:first-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        let county = $tr.find('td:first-child').text();
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
    // Error "Please enable JavaScript to view the page content."
    scraper: async function() {
      let counties = [];
      let $ = await load(this.url);

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
      let $ = await load(this.url);

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
      let $ = await load(this.url);

      let $th = $('th:contains("COVID-19 Case Count")');
      let $table = $th.closest('table');

      {
        let $tr = $table.find('*:contains("Positive")').closest('tr');
        let $dataTd = $tr.find('td:last-child')
        cases = parse.number($dataTd.text());
      }

      {
        let $tr = $table.find('*:contains("Deaths")').closest('tr');
        let $dataTd = $tr.find('td:last-child')
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
    _scraper: async function() {
      let cases;
      let $ = await load(this.url);

      let $table = $('.contacts_table');

      {
        let $p = $table.find('*:contains("Positive Cases:")');
        console.log($p.html());
      }

      return {
        cases: cases
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
      let $ = await load(this.url);

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
      let $ = await load(this.url);

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
      let $ = await load(this.url);

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
      let $ = await load(this.url);

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
      let $ = await load(this.url);

      cases = parse.number($('h1:contains("TOTAL")').parent().next().text());
      deaths = parse.number($('h1:contains("DEATHS")').parent().prev().text());

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
      let $ = await load(this.url);

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
  },
  {
    county: 'Sacramento County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.saccounty.net/COVID-19/Pages/default.aspx',
    scraper: async function() {
      let $ = await load(this.url);

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
      let $ = await load(this.url);

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
      let $ = await load(this.url);

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
      let $ = await load(this.url);

      let $table = $('p:contains("Confirmed COVID-19 Cases in Placer County")').nextAll('table').first();
      return {
        cases: parse.number($table.find('td:contains("Positive Tests")').closest('tr').find('td:last-child').text()),
        deaths: parse.number($table.find('td:contains("Deaths")').closest('tr').find('td:last-child').text())
      };
    }
  },
  {
    county: 'Shasta County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.co.shasta.ca.us/index/hhsa/health-safety/current-heath-concerns/coronavirus',
    scraper: async function() {
      let $ = await load(this.url);

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
  },
  {
    county: 'Orange County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.ochealthinfo.com/phs/about/epidasmt/epi/dip/prevention/novel_coronavirus',
  },
  {
    county: 'Riverside County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.rivcoph.org/coronavirus',
  },
  {
    county: 'San Diego County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
  },
  {
    county: 'Ventura County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.ventura.org/covid19/',
  },
];

export default scrapers;
