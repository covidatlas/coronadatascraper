import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as geography from '../../../lib/geography/index.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-GA',
  country: 'iso1:US',
  url: 'https://dph.georgia.gov/covid-19-daily-status-report',
  type: 'table',
  aggregate: 'county',
  sources: [
    {
      url: 'https://dph.georgia.gov',
      name: 'Georgia Department of Public Health'
    }
  ],
  _counties: [
    'Appling County',
    'Atkinson County',
    'Bacon County',
    'Baker County',
    'Baldwin County',
    'Banks County',
    'Barrow County',
    'Bartow County',
    'Ben Hill County',
    'Berrien County',
    'Bibb County',
    'Bleckley County',
    'Brantley County',
    'Brooks County',
    'Bryan County',
    'Bulloch County',
    'Burke County',
    'Butts County',
    'Calhoun County',
    'Camden County',
    'Candler County',
    'Carroll County',
    'Catoosa County',
    'Charlton County',
    'Chatham County',
    'Chattahoochee County',
    'Chattooga County',
    'Cherokee County',
    'Clarke County',
    'Clay County',
    'Clayton County',
    'Clinch County',
    'Cobb County',
    'Coffee County',
    'Colquitt County',
    'Columbia County',
    'Cook County',
    'Coweta County',
    'Crawford County',
    'Crisp County',
    'Dade County',
    'Dawson County',
    'Decatur County',
    'DeKalb County',
    'Dodge County',
    'Dooly County',
    'Dougherty County',
    'Douglas County',
    'Early County',
    'Echols County',
    'Effingham County',
    'Elbert County',
    'Emanuel County',
    'Evans County',
    'Fannin County',
    'Fayette County',
    'Floyd County',
    'Forsyth County',
    'Franklin County',
    'Fulton County',
    'Gilmer County',
    'Glascock County',
    'Glynn County',
    'Gordon County',
    'Grady County',
    'Greene County',
    'Gwinnett County',
    'Habersham County',
    'Hall County',
    'Hancock County',
    'Haralson County',
    'Harris County',
    'Hart County',
    'Heard County',
    'Henry County',
    'Houston County',
    'Irwin County',
    'Jackson County',
    'Jasper County',
    'Jeff Davis County',
    'Jefferson County',
    'Jenkins County',
    'Johnson County',
    'Jones County',
    'Lamar County',
    'Lanier County',
    'Laurens County',
    'Lee County',
    'Liberty County',
    'Lincoln County',
    'Long County',
    'Lowndes County',
    'Lumpkin County',
    'Macon County',
    'Madison County',
    'Marion County',
    'McDuffie County',
    'McIntosh County',
    'Meriwether County',
    'Miller County',
    'Mitchell County',
    'Monroe County',
    'Montgomery County',
    'Morgan County',
    'Murray County',
    'Muscogee County',
    'Newton County',
    'Oconee County',
    'Oglethorpe County',
    'Paulding County',
    'Peach County',
    'Pickens County',
    'Pierce County',
    'Pike County',
    'Polk County',
    'Pulaski County',
    'Putnam County',
    'Quitman County',
    'Rabun County',
    'Randolph County',
    'Richmond County',
    'Rockdale County',
    'Schley County',
    'Screven County',
    'Seminole County',
    'Spalding County',
    'Stephens County',
    'Stewart County',
    'Sumter County',
    'Talbot County',
    'Taliaferro County',
    'Tattnall County',
    'Taylor County',
    'Telfair County',
    'Terrell County',
    'Thomas County',
    'Tift County',
    'Toombs County',
    'Towns County',
    'Treutlen County',
    'Troup County',
    'Turner County',
    'Twiggs County',
    'Union County',
    'Upson County',
    'Walker County',
    'Walton County',
    'Ware County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Webster County',
    'Wheeler County',
    'White County',
    'Whitfield County',
    'Wilcox County',
    'Wilkes County',
    'Wilkinson County',
    'Worth County'
  ],
  _countyMap: {
    Mcduffie: 'McDuffie',
    Dekalb: 'DeKalb',
    Mcintosh: 'McIntosh'
  },
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      let counties = [];
      const $trs = $('table:contains(County):contains(Cases) tbody > tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        let name = $tr.find('td:first-child').text();
        name = this._countyMap[name] || name;
        let county = geography.addCounty(parse.string(name));

        const cases = parse.number($tr.find('td:nth-child(2)').text());

        if (county === 'Unknown County') {
          county = UNASSIGNED;
        }

        counties.push({ county, cases });
      });

      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-03-27': async function() {
      const tmp = await fetch.page(this, this.url, 'tmpindex');
      const pageHTML = tmp.html();
      [this.url] = pageHTML.match(/https:\/\/(.*)\.cloudfront\.net/);

      const $ = await fetch.page(this, this.url, 'default');
      let counties = [];
      const $trs = $('*[class^="tcell"]:contains("COVID-19 Confirmed Cases By County")')
        .closest('tbody')
        .find('tr:not(:first-child,:last-child)');
      assert($trs.length > 0, 'no rows found');

      $trs.each((index, tr) => {
        const $tr = $(tr);
        let name = $tr.find('td:first-child').text();
        name = this._countyMap[name] || name;
        let county = geography.addCounty(parse.string(name));

        const cases = parse.number($tr.find('td:nth-child(2)').text());

        if (['Unknown County', 'Non-Georgia Resident County'].includes(county)) {
          county = UNASSIGNED;
        }

        const deaths = parse.number($tr.find('td:last-child').text());
        counties.push({ county, cases, deaths });
      });

      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    }
  }
};

export default scraper;
