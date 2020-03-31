import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as rules from '../../../lib/rules.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

// updated to include deaths in timeseries

const scraper = {
  state: 'OK',
  country: 'USA',
  type: 'table',
  aggregate: 'county',
  url: 'https://coronavirus.health.ok.gov/',
  sources: [
    {
      name: 'Oklahoma State Department of Health'
    }
  ],
  _reject: [
    {
      county: 'Total County'
    }
  ],
  maintainers: [
    {
      name: 'Paul Boal',
      email: 'paul.boal@amitechsolutions.com',
      url: 'https://amitechsolutions.com',
      github: 'paulboal',
      country: 'USA',
      flag: '🇺🇸'
    }
  ],
  _countyMap: {},
  _counties: [
    'Adair County',
    'Alfalfa County',
    'Atoka County',
    'Beaver County',
    'Beckham County',
    'Blaine County',
    'Bryan County',
    'Caddo County',
    'Canadian County',
    'Carter County',
    'Cherokee County',
    'Choctaw County',
    'Cimarron County',
    'Cleveland County',
    'Coal County',
    'Comanche County',
    'Cotton County',
    'Craig County',
    'Creek County',
    'Custer County',
    'Delaware County',
    'Dewey County',
    'Ellis County',
    'Garfield County',
    'Garvin County',
    'Grady County',
    'Grant County',
    'Greer County',
    'Harmon County',
    'Harper County',
    'Haskell County',
    'Hughes County',
    'Jackson County',
    'Jefferson County',
    'Johnston County',
    'Kay County',
    'Kingfisher County',
    'Kiowa County',
    'Latimer County',
    'Le Flore County',
    'Lincoln County',
    'Logan County',
    'Love County',
    'Major County',
    'Marshall County',
    'Mayes County',
    'McClain County',
    'McCurtain County',
    'McIntosh County',
    'Murray County',
    'Muskogee County',
    'Noble County',
    'Nowata County',
    'Okfuskee County',
    'Oklahoma County',
    'Okmulgee County',
    'Osage County',
    'Ottawa County',
    'Pawnee County',
    'Payne County',
    'Pittsburg County',
    'Pontotoc County',
    'Pottawatomie County',
    'Pushmataha County',
    'Roger Mills County',
    'Rogers County',
    'Seminole County',
    'Sequoyah County',
    'Stephens County',
    'Texas County',
    'Tillman County',
    'Tulsa County',
    'Wagoner County',
    'Washington County',
    'Washita County',
    'Woods County',
    'Woodward County'
  ],
  async scraper() {
    let counties = [];
    const $ = await fetch.page(this.url);
    const $table = $("table[summary='COVID-19 Cases by County']").first();

    const $trs = $table.find('tbody').find('tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const countyName = parse.string($tr.find('td:nth-child(1)').text());
      const countyObj = {
        county: geography.addCounty(parse.string(countyName)),
        cases: parse.number($tr.find('td:nth-child(2)').text() || 0),
        deaths: parse.number($tr.find('td:nth-child(3)').text() || 0)
      };
      if (rules.isAcceptable(countyObj, null, this._reject)) {
        counties.push(countyObj);
      }
    });
    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
