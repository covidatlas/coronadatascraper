import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'OH',
  country: 'USA',
  aggregate: 'county',
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
      const $ = await fetch.page(this.url);
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
    '2020-3-16': async function() {
      let counties = [];
      let arrayOfCounties = [];

      this.url = 'https://coronavirus.ohio.gov/wps/portal/gov/covid-19/';
      const $ = await fetch.page(this.url);
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
    }
  }
};

export default scraper;
