import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-OH',
  country: 'iso1:US',
  aggregate: 'county',
  sources: [
    {
      url: 'https://coronavirus.ohio.gov/wps/portal/gov/covid-19/',
      name: 'Ohio Department of Health'
    }
  ],
  _counties: [
    'Adams County',
    'Allen County',
    'Ashland County',
    'Ashtabula County',
    'Athens County',
    'Auglaize County',
    'Belmont County',
    'Brown County',
    'Butler County',
    'Carroll County',
    'Champaign County',
    'Clark County',
    'Clermont County',
    'Clinton County',
    'Columbiana County',
    'Coshocton County',
    'Crawford County',
    'Cuyahoga County',
    'Darke County',
    'Defiance County',
    'Delaware County',
    'Erie County',
    'Fairfield County',
    'Fayette County',
    'Franklin County',
    'Fulton County',
    'Gallia County',
    'Geauga County',
    'Greene County',
    'Guernsey County',
    'Hamilton County',
    'Hancock County',
    'Hardin County',
    'Harrison County',
    'Henry County',
    'Highland County',
    'Hocking County',
    'Holmes County',
    'Huron County',
    'Jackson County',
    'Jefferson County',
    'Knox County',
    'Lake County',
    'Lawrence County',
    'Licking County',
    'Logan County',
    'Lorain County',
    'Lucas County',
    'Madison County',
    'Mahoning County',
    'Marion County',
    'Medina County',
    'Meigs County',
    'Mercer County',
    'Miami County',
    'Monroe County',
    'Montgomery County',
    'Morgan County',
    'Morrow County',
    'Muskingum County',
    'Noble County',
    'Ottawa County',
    'Paulding County',
    'Perry County',
    'Pickaway County',
    'Pike County',
    'Portage County',
    'Preble County',
    'Putnam County',
    'Richland County',
    'Ross County',
    'Sandusky County',
    'Scioto County',
    'Seneca County',
    'Shelby County',
    'Stark County',
    'Summit County',
    'Trumbull County',
    'Tuscarawas County',
    'Union County',
    'Van Wert County',
    'Vinton County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Williams County',
    'Wood County',
    'Wyandot County'
  ],
  scraper: {
    '0': async function() {
      let counties = [];
      let arrayOfCounties = [];
      this.url = 'https://odh.ohio.gov/wps/portal/gov/odh/know-our-programs/Novel-Coronavirus/welcome/';
      this.type = 'paragraph';
      const $ = await fetch.page(this, this.url, 'default');
      const $paragraph = $('p:contains("Number of counties with cases:")').text();
      const regExp = /\(([^)]+)\)/;
      const parsed = regExp.exec($paragraph);
      arrayOfCounties = parsed[1].split(',');

      arrayOfCounties.forEach(county => {
        const splitCounty = county.trim().split(' ');
        counties.push({
          county: geography.addCounty(parse.string(splitCounty[0])),
          cases: parse.number(splitCounty[1])
        });
      });

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-03-16': async function() {
      let counties = [];
      let arrayOfCounties = [];

      this.url = 'https://coronavirus.ohio.gov/wps/portal/gov/covid-19/';
      this.type = 'paragraph';
      const $ = await fetch.page(this, this.url, 'default');
      const $paragraph = $('p:contains("Number of counties with cases:")').text();
      const parsed = $paragraph.replace(/([()])/g, '').replace('* Number of counties with cases: ', '');
      arrayOfCounties = parsed.split(',');
      arrayOfCounties.forEach(county => {
        const splitCounty = county.trim().split(' ');
        counties.push({
          county: geography.addCounty(parse.string(splitCounty[0])),
          cases: parse.number(splitCounty[1])
        });
      });

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-03-25': async function() {
      let counties = [];
      let arrayOfCounties = [];

      this.url = 'https://coronavirus.ohio.gov/wps/portal/gov/covid-19/';
      this.type = 'paragraph';
      const $ = await fetch.page(this, this.url, 'default');
      const $paragraph = $('p:contains("Number of counties with cases:")').text();
      const parsed = $paragraph
        .replace(/([()])/g, '')
        .replace('* Number of counties with cases: ', '')
        .replace(/[0-9]+[\s–\s]+/g, '');
      arrayOfCounties = parsed.split(',');
      arrayOfCounties.forEach(county => {
        const splitCounty = county.trim().split(' ');
        counties.push({
          county: geography.addCounty(parse.string(splitCounty[0])),
          cases: parse.number(splitCounty[1])
        });
      });

      counties.push(transform.sumData(counties));

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-03-26': async function() {
      this.url =
        'https://public.tableau.com/views/OverviewDashboard_15852499073250/DashboardOverview_1?:embed=y&:showVizHome=no&:host_url=https%3A%2F%2Fpublic.tableau.com%2F&:embed_code_version=3&:tabs=no&:toolbar=no&:showAppBanner=false&iframeSizedToWindow=true&:loadOrderID=0';
      await fetch.page(this, this.url, 'default');
      throw new Error('Ohio has an impossible to access tablaeu dashboard');
    },
    '2020-03-28': async function() {
      this.url = 'https://coronavirus.ohio.gov/static/COVIDSummaryData.csv';
      this.type = 'csv';
      const rows = await fetch.csv(this, this.url, 'default');

      // The CSV is coming in with the BOM bytes mangled onto the front.
      // So the header of the first column is 'ï»¿County'
      // This hack lets me determine the header value for sure
      const countyCol = Object.keys(rows[0])[0];
      // Make sure it's actually the County header
      if (!countyCol.includes('County')) {
        throw new Error('First column of csv is no longer county!');
      }

      const cases = {};
      const deaths = {};

      for (const county of this._counties) {
        cases[county] = 0;
        deaths[county] = 0;
      }

      for (const row of rows) {
        const county = geography.addCounty(row[countyCol]);
        if (county !== 'Grand Total County') {
          cases[county] += parse.number(row['Case Count']);
          deaths[county] += parse.number(row['Death Count']);
        }
      }

      let counties = [];
      for (const county of this._counties) {
        counties.push({
          county,
          cases: cases[county],
          deaths: deaths[county]
        });
      }

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
