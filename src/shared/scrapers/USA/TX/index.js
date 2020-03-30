import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'TX',
  country: 'USA',
  aggregate: 'county',
  certValidation: false,
  sources: [
    {
      url: 'https://www.dshs.state.tx.us',
      name: 'Texas Health and Human Services',
      description: 'Texas Department of State Health Services'
    }
  ],
  _counties: [
    'Anderson County',
    'Andrews County',
    'Angelina County',
    'Aransas County',
    'Archer County',
    'Armstrong County',
    'Atascosa County',
    'Austin County',
    'Bailey County',
    'Bandera County',
    'Bastrop County',
    'Baylor County',
    'Bee County',
    'Bell County',
    'Bexar County',
    'Blanco County',
    'Borden County',
    'Bosque County',
    'Bowie County',
    'Brazoria County',
    'Brazos County',
    'Brewster County',
    'Briscoe County',
    'Brooks County',
    'Brown County',
    'Burleson County',
    'Burnet County',
    'Caldwell County',
    'Calhoun County',
    'Callahan County',
    'Cameron County',
    'Camp County',
    'Carson County',
    'Cass County',
    'Castro County',
    'Chambers County',
    'Cherokee County',
    'Childress County',
    'Clay County',
    'Cochran County',
    'Coke County',
    'Coleman County',
    'Collin County',
    'Collingsworth County',
    'Colorado County',
    'Comal County',
    'Comanche County',
    'Concho County',
    'Cooke County',
    'Coryell County',
    'Cottle County',
    'Crane County',
    'Crockett County',
    'Crosby County',
    'Culberson County',
    'Dallam County',
    'Dallas County',
    'Dawson County',
    'Deaf Smith County',
    'Delta County',
    'Denton County',
    'DeWitt County',
    'Dickens County',
    'Dimmit County',
    'Donley County',
    'Duval County',
    'Eastland County',
    'Ector County',
    'Edwards County',
    'Ellis County',
    'El Paso County',
    'Erath County',
    'Falls County',
    'Fannin County',
    'Fayette County',
    'Fisher County',
    'Floyd County',
    'Foard County',
    'Fort Bend County',
    'Franklin County',
    'Freestone County',
    'Frio County',
    'Gaines County',
    'Galveston County',
    'Garza County',
    'Gillespie County',
    'Glasscock County',
    'Goliad County',
    'Gonzales County',
    'Gray County',
    'Grayson County',
    'Gregg County',
    'Grimes County',
    'Guadalupe County',
    'Hale County',
    'Hall County',
    'Hamilton County',
    'Hansford County',
    'Hardeman County',
    'Hardin County',
    'Harris County',
    'Harrison County',
    'Hartley County',
    'Haskell County',
    'Hays County',
    'Hemphill County',
    'Henderson County',
    'Hidalgo County',
    'Hill County',
    'Hockley County',
    'Hood County',
    'Hopkins County',
    'Houston County',
    'Howard County',
    'Hudspeth County',
    'Hunt County',
    'Hutchinson County',
    'Irion County',
    'Jack County',
    'Jackson County',
    'Jasper County',
    'Jeff Davis County',
    'Jefferson County',
    'Jim Hogg County',
    'Jim Wells County',
    'Johnson County',
    'Jones County',
    'Karnes County',
    'Kaufman County',
    'Kendall County',
    'Kenedy County',
    'Kent County',
    'Kerr County',
    'Kimble County',
    'King County',
    'Kinney County',
    'Kleberg County',
    'Knox County',
    'Lamar County',
    'Lamb County',
    'Lampasas County',
    'La Salle County',
    'Lavaca County',
    'Lee County',
    'Leon County',
    'Liberty County',
    'Limestone County',
    'Lipscomb County',
    'Live Oak County',
    'Llano County',
    'Loving County',
    'Lubbock County',
    'Lynn County',
    'McCulloch County',
    'McLennan County',
    'McMullen County',
    'Madison County',
    'Marion County',
    'Martin County',
    'Mason County',
    'Matagorda County',
    'Maverick County',
    'Medina County',
    'Menard County',
    'Midland County',
    'Milam County',
    'Mills County',
    'Mitchell County',
    'Montague County',
    'Montgomery County',
    'Moore County',
    'Morris County',
    'Motley County',
    'Nacogdoches County',
    'Navarro County',
    'Newton County',
    'Nolan County',
    'Nueces County',
    'Ochiltree County',
    'Oldham County',
    'Orange County',
    'Palo Pinto County',
    'Panola County',
    'Parker County',
    'Parmer County',
    'Pecos County',
    'Polk County',
    'Potter County',
    'Presidio County',
    'Rains County',
    'Randall County',
    'Reagan County',
    'Real County',
    'Red River County',
    'Reeves County',
    'Refugio County',
    'Roberts County',
    'Robertson County',
    'Rockwall County',
    'Runnels County',
    'Rusk County',
    'Sabine County',
    'San Augustine County',
    'San Jacinto County',
    'San Patricio County',
    'San Saba County',
    'Schleicher County',
    'Scurry County',
    'Shackelford County',
    'Shelby County',
    'Sherman County',
    'Smith County',
    'Somervell County',
    'Starr County',
    'Stephens County',
    'Sterling County',
    'Stonewall County',
    'Sutton County',
    'Swisher County',
    'Tarrant County',
    'Taylor County',
    'Terrell County',
    'Terry County',
    'Throckmorton County',
    'Titus County',
    'Tom Green County',
    'Travis County',
    'Trinity County',
    'Tyler County',
    'Upshur County',
    'Upton County',
    'Uvalde County',
    'Val Verde County',
    'Van Zandt County',
    'Victoria County',
    'Walker County',
    'Waller County',
    'Ward County',
    'Washington County',
    'Webb County',
    'Wharton County',
    'Wheeler County',
    'Wichita County',
    'Wilbarger County',
    'Willacy County',
    'Williamson County',
    'Wilson County',
    'Winkler County',
    'Wise County',
    'Wood County',
    'Yoakum County',
    'Young County',
    'Zapata County',
    'Zavala County'
  ],
  _countyMap: {
    'De Witt County': 'DeWitt County'
  },
  scraper: {
    '0': async function() {
      let counties = [];
      this.url = 'https://www.dshs.state.tx.us/news/updates.shtm';
      this.type = 'table';
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
        const county = geography.addCounty(
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
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-24 16:00:00': async function() {
      let counties = [];
      this.url = 'https://www.dshs.state.tx.us/news/updates.shtm';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const $table = $('table[summary="COVID-19 Cases in Texas Counties"]');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = geography.addCounty(
          $tr
            .find('td:first-child')
            .text()
            .replace(/[\d]*/g, '')
        );
        const cases = parse.number($tr.find('td:nth-child(2)').text());
        let deaths = $tr.find('td:last-child').text();
        if (deaths === '-') {
          deaths = 0;
        } else {
          deaths = parse.number(deaths);
        }
        counties.push({
          county,
          cases,
          deaths
        });
      });
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-24': async function() {
      let counties = [];
      this.url = 'https://opendata.arcgis.com/datasets/bc83058386d2434ca8cf90b26dc6b580_0.csv';
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      for (const row of data) {
        let county = geography.addCounty(parse.string(row.County));
        county = this._countyMap[county] || county;
        const data = {
          county,
          cases: parse.number(row.Count_ || 0),
          deaths: parse.number(row.Deaths || 0)
        };
        counties.push(data);
      }
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
