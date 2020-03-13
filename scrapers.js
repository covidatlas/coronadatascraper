import load from './lib/load.js';

let scrapers = [
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
        cases = parseInt($p.text().replace(/[^\d]/g, ''), 10);
      }

      {
        let $p = $h2.nextAll('*:contains("Deaths:")');
        deaths = parseInt($p.text().replace(/[^\d]/g, ''), 10);
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
        cases = parseInt($dataTd.text(), 10);
      }

      {
        let $tr = $table.find('*:contains("Deaths")').closest('tr');
        let $dataTd = $tr.find('td:last-child')
        deaths = parseInt($dataTd.text(), 10);
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
      cases = parseInt($td.text(), 10);

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

      cases = parseInt($h1.text(), 10);

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
      cases = parseInt($cell.text(), 10);

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
  },
  {
    county: 'Contra Costa County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.coronavirus.cchealth.org/',
  },
  {
    county: 'Stanislaus County',
    state: 'CA',
    country: 'USA',
    url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
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
  },
  {
    county: 'Fresno County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.co.fresno.ca.us/departments/public-health/covid-19',
  },
  {
    county: 'Madera County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.maderacounty.com/government/public-health/health-updates/corona-virus',
  },
  {
    county: 'Placer County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.placer.ca.gov/6448/Cases-in-Placer',
  },
  {
    county: 'Shasta County',
    state: 'CA',
    country: 'USA',
    url: 'https://www.co.shasta.ca.us/index/hhsa/health-safety/current-heath-concerns/coronavirus',
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
