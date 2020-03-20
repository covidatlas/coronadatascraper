import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'FL',
  country: 'USA',
  priority: 1,
  aggregate: 'county',
  _counties: [
    'Alachua County',
    'Baker County',
    'Bay County',
    'Bradford County',
    'Brevard County',
    'Broward County',
    'Calhoun County',
    'Charlotte County',
    'Citrus County',
    'Clay County',
    'Collier County',
    'Columbia County',
    'DeSoto County',
    'Dixie County',
    'Duval County',
    'Escambia County',
    'Flagler County',
    'Franklin County',
    'Gadsden County',
    'Gilchrist County',
    'Glades County',
    'Gulf County',
    'Hamilton County',
    'Hardee County',
    'Hendry County',
    'Hernando County',
    'Highlands County',
    'Hillsborough County',
    'Holmes County',
    'Indian River County',
    'Jackson County',
    'Jefferson County',
    'Lafayette County',
    'Lake County',
    'Lee County',
    'Leon County',
    'Levy County',
    'Liberty County',
    'Madison County',
    'Manatee County',
    'Marion County',
    'Martin County',
    'Miami-Dade County',
    'Monroe County',
    'Nassau County',
    'Okaloosa County',
    'Okeechobee County',
    'Orange County',
    'Osceola County',
    'Palm Beach County',
    'Pasco County',
    'Pinellas County',
    'Polk County',
    'Putnam County',
    'St. Johns County',
    'St. Lucie County',
    'Santa Rosa County',
    'Sarasota County',
    'Seminole County',
    'Sumter County',
    'Suwannee County',
    'Taylor County',
    'Union County',
    'Volusia County',
    'Wakulla County',
    'Walton County',
    'Washington County'
  ],
  scraper: {
    '0': async function() {
      this.type = 'table';
      this.url = 'http://www.floridahealth.gov/diseases-and-conditions/COVID-19/index.html';
      const countiesMap = {};
      const $ = await fetch.page(this.url);
      const $table = $('*:contains("Diagnosed in Florida")').closest('table');
      const $trs = $table.find('tr');
      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        const $tr = $(tr);
        const county = transform.addCounty(parse.string($tr.find('td:nth-child(2)').text()));
        countiesMap[county] = countiesMap[county] || { cases: 0 };
        countiesMap[county].cases += 1;
      });
      let counties = transform.objectToArray(countiesMap);
      const text = $('div:contains("Non-Florida Residents")')
        .last()
        .text();
      const nonFlorida = text.split(' \u2013 ')[0];
      if (nonFlorida) {
        counties.push({
          name: UNASSIGNED,
          cases: nonFlorida
        });
      }

      counties.push(transform.sumData(counties));

      counties = transform.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    },
    '2020-3-16': async function() {
      this.type = 'csv';
      this.url = 'https://opendata.arcgis.com/datasets/b4930af3f43a48138c70bca409b5c452_0.csv';
      const data = await fetch.csv(this.url);
      let counties = [];
      for (const county of data) {
        counties.push({
          county: transform.addCounty(parse.string(county.County)),
          cases: parse.number(county.Counts)
        });
      }

      counties.push(transform.sumData(counties));

      counties = transform.addEmptyRegions(counties, this._counties, 'county');

      return counties;
    }
  }
};

export default scraper;
