import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'AL',
  country: 'USA',
  url: 'http://www.alabamapublichealth.gov/infectiousdiseases/2019-coronavirus.html',
  type: 'table',
  aggregate: 'county',
  sources: [
    {
      name: 'Alabama Department of Public Health - Division of Infectious Diseases & Outbreaks',
      url: 'http://www.alabamapublichealth.gov/infectiousdiseases/2019-coronavirus.html'
    }
  ],
  _counties: [
    'Autauga County',
    'Baldwin County',
    'Barbour County',
    'Bibb County',
    'Blount County',
    'Bullock County',
    'Butler County',
    'Calhoun County',
    'Chambers County',
    'Cherokee County',
    'Chilton County',
    'Choctaw County',
    'Clarke County',
    'Clay County',
    'Cleburne County',
    'Coffee County',
    'Colbert County',
    'Conecuh County',
    'Coosa County',
    'Covington County',
    'Crenshaw County',
    'Cullman County',
    'Dale County',
    'Dallas County',
    'DeKalb County',
    'Elmore County',
    'Escambia County',
    'Etowah County',
    'Fayette County',
    'Franklin County',
    'Geneva County',
    'Greene County',
    'Hale County',
    'Henry County',
    'Houston County',
    'Jackson County',
    'Jefferson County',
    'Lamar County',
    'Lauderdale County',
    'Lawrence County',
    'Lee County',
    'Limestone County',
    'Lowndes County',
    'Macon County',
    'Madison County',
    'Marengo County',
    'Marion County',
    'Marshall County',
    'Mobile County',
    'Monroe County',
    'Montgomery County',
    'Morgan County',
    'Perry County',
    'Pickens County',
    'Pike County',
    'Randolph County',
    'Russell County',
    'St. Clair County',
    'Shelby County',
    'Sumter County',
    'Talladega County',
    'Tallapoosa County',
    'Tuscaloosa County',
    'Walker County',
    'Washington County',
    'Wilcox County',
    'Winston County'
  ],
  scraper: {
    '0': async function() {
      let counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('td:contains("(COVID-19) in Alabama")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        const $tr = $(tr);
        const countyName = geography.addCounty(parse.string($tr.find('td:first-child').text()));
        if (countyName === 'Out of State County') {
          return;
        }
        counties.push({
          county: countyName,
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-26': async function() {
      let counties = [];
      this.url = await fetch.getArcGISCSVURLFromOrgId(7, '4RQmZZ0yaZkGR1zy', 'COV19_Public_Dashboard_ReadOnly');
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      for (const row of data) {
        const county = geography.addCounty(row.CNTYNAME);
        const cases = parse.number(row.CONFIRMED);
        const deaths = parse.number(row.DIED);

        // console.log(county, cases, deaths);
        counties.push({
          county,
          cases,
          deaths
        });
      }
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
