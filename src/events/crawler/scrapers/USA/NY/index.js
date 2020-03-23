import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as geography from '../../../lib/geography.js';
import getBoroughs from './borough.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'NY',
  country: 'USA',
  type: 'table',
  aggregate: 'county',
  _countyMap: {
    Broom: 'Broome'
  },
  _counties: [
    'Albany County',
    'Allegany County',
    'Bronx County',
    'Broome County',
    'Cattaraugus County',
    'Cayuga County',
    'Chautauqua County',
    'Chemung County',
    'Chenango County',
    'Clinton County',
    'Columbia County',
    'Cortland County',
    'Delaware County',
    'Dutchess County',
    'Erie County',
    'Essex County',
    'Franklin County',
    'Fulton County',
    'Genesee County',
    'Greene County',
    'Hamilton County',
    'Herkimer County',
    'Jefferson County',
    'Kings County',
    'Lewis County',
    'Livingston County',
    'Madison County',
    'Monroe County',
    'Montgomery County',
    'Nassau County',
    'New York County',
    'Niagara County',
    'Oneida County',
    'Onondaga County',
    'Ontario County',
    'Orange County',
    'Orleans County',
    'Oswego County',
    'Otsego County',
    'Putnam County',
    'Queens County',
    'Rensselaer County',
    'Richmond County',
    'Rockland County',
    'St. Lawrence County',
    'Saratoga County',
    'Schenectady County',
    'Schoharie County',
    'Schuyler County',
    'Seneca County',
    'Steuben County',
    'Suffolk County',
    'Sullivan County',
    'Tioga County',
    'Tompkins County',
    'Ulster County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Westchester County',
    'Wyoming County',
    'Yates County'
  ],
  _boroughs: {
    Bronx: 'Bronx County',
    Brooklyn: 'Kings County',
    Manhattan: 'New York County',
    Queens: 'Queens County',
    'Staten Island': 'Richmond County'
  },
  async scraper() {
    this.url = datetime.scrapeDateIsBefore('2020-3-17')
      ? 'https://www.health.ny.gov/diseases/communicable/coronavirus/'
      : 'https://coronavirus.health.ny.gov/county-county-breakdown-positive-cases';
    let counties = [];
    const $ = await fetch.page(this.url);
    const boroughs = await getBoroughs();
    let $table;
    if (datetime.scrapeDateIsBefore('2020-3-17')) {
      $table = $('#case_count_table');
    } else {
      $table = $('table').first();
    }
    const $trs = $table.find('tr:not(.total_row):not(:first-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      let countyName = parse.string($tr.find('td:first-child').text()).replace(':', '');
      countyName = this._countyMap[countyName] || countyName;
      if (
        countyName !== 'New York State (Outside of NYC)' &&
        countyName !== 'Total Positive Cases (Statewide)' &&
        countyName !== 'Total Number of Positive Cases'
      ) {
        const countyObj = {
          cases: parse.number($tr.find('td:last-child').text())
        };

        if (countyName === 'New York City') {
          countyObj.city = countyName;
          countyObj.feature = geography.generateMultiCountyFeature(
            ['Bronx County, NY', 'Kings County, NY', 'New York County, NY', 'Queens County, NY', 'Richmond County, NY'],
            {
              state: 'NY',
              country: 'USA'
            }
          );
        } else {
          countyObj.county = geography.addCounty(countyName);
        }
        counties.push(countyObj);
      }
    });

    counties.push(transform.sumData(counties));

    boroughs.forEach(item => {
      counties.push({
        cases: item.cases,
        county: this._boroughs[item.borough]
      });
    });

    counties = geography.addEmptyRegions(counties, this._counties, 'county');

    return counties;
  }
};

export default scraper;
