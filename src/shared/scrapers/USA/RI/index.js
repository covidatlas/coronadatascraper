import cheerioTableparser from 'cheerio-tableparser';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'RI',
  country: 'USA',
  priority: 1,
  type: 'csv',
  sources: [
    {
      url: 'https://health.ri.gov/data/covid-19/',
      name: 'State of Rhode Island Department of Health'
    }
  ],
  // This google sheet is linked from the HTML of https://health.ri.gov/data/covid-19/
  // It is used to render the little table of state totals, but contains a per-count tab
  url:
    'https://docs.google.com/spreadsheets/d/1n-zMS9Al94CPj_Tc3K7Adin-tN9x1RSjjx2UzJ4SV7Q/gviz/tq?tqx=out:csv&sheet=County+Data#gid=0',

  _counties: ['Bristol County', 'Kent County', 'Newport County', 'Providence County', 'Washington County'],
  _cities: {
    Barrington: 'Bristol',
    Bristol: 'Bristol',
    Burrillville: 'Providence',
    'Central Falls': 'Providence',
    Charlestown: 'Washington',
    Coventry: 'Kent',
    Cranston: 'Providence',
    Cumberland: 'Providence',
    'East Greenwich': 'Kent',
    'East Providence': 'Providence',
    Exeter: 'Washington',
    Foster: 'Providence',
    Glocester: 'Providence',
    Hopkinton: 'Washington',
    Jamestown: 'Newport',
    Johnston: 'Providence',
    Lincoln: 'Providence',
    'Little Compton': 'Newport',
    Middletown: 'Newport',
    Narragansett: 'Washington',
    Newport: 'Newport',
    'New Shoreham': 'Washington',
    'North Kingstown': 'Washington',
    'North Providence': 'Providence',
    'North Smithfield': 'Providence',
    Pawtucket: 'Providence',
    Portsmouth: 'Newport',
    Providence: 'Providence',
    Richmond: 'Washington',
    Scituate: 'Providence',
    Smithfield: 'Providence',
    'South Kingstown': 'Washington',
    Tiverton: 'Newport',
    Warren: 'Bristol',
    Warwick: 'Kent',
    Westerly: 'Washington',
    'West Greenwich': 'Kent',
    'West Warwick': 'Kent',
    Woonsocket: 'Providence'
  },

  _good_headers(data) {
    if (parse.string(data[0][0]) !== 'City/Town') {
      return false;
    }
    if (parse.string(data[1][0]) !== 'Rhode Island COVID-19 patients by city/town of residence') {
      return false;
    }
    return true;
  },

  scraper: {
    '0': async function() {
      const data = await fetch.csv(this.url);
      const counties = [];
      for (const row of data) {
        const caseHdr = 'Number of  COVID-19 positive (including presumptive positive) cases';

        const county = geography.addCounty(row.County);
        const cases = parse.number(row[caseHdr]);

        // skip the last updated timestamp row
        if (county.indexOf('last updated') !== -1) {
          continue;
        }

        counties.push({
          county,
          cases
        });
      }

      counties.push(transform.sumData(counties, { aggregate: 'county' }));
      return counties;
    },
    '2020-3-29': async function() {
      const cities = [];
      let regions = [];

      this.headless = true;
      this.url = 'https://health.ri.gov/data/covid-19/';
      const $ = await fetch.headless(this.url);
      cheerioTableparser($);

      // Need to pull this out explicitly because their html table includes
      // non-numbers like "<5"
      const stateCases = parse.number(
        $('td:contains("Number of Rhode Island COVID-19 positive")')
          .next()
          .text()
      );
      const stateDeaths = parse.number(
        $('td:contains("Number of Rhode Islanders to die")')
          .next()
          .text()
      );
      regions.push({
        cases: stateCases,
        deaths: stateDeaths,
        aggregate: 'county'
      });

      const $table = $('th:contains("Rhode Island COVID-19 patients by city/town of residence")').closest('table');
      const data = $table.parsetable(false, false, true);
      if (!this._good_headers(data)) {
        throw new Error('Unknown headers in html table');
      }

      const countyCases = {};
      for (const county of this._counties) {
        countyCases[county] = 0;
      }

      const numRows = data[0].length;
      const startRow = 1; // skip the headers
      for (let i = startRow; i < numRows; i++) {
        const city = parse.string(data[0][i]);
        let cases = parse.string(data[1][i]);
        if (cases === '<5') {
          cases = 3; // pick something!
        } else {
          cases = parse.number(cases);
        }

        const county = geography.addCounty(this._cities[city]);
        countyCases[county] += cases;

        cities.push({
          county,
          city,
          cases
        });
      }

      for (const county of this._counties) {
        regions.push({
          county,
          cases: countyCases[county],
          aggregate: 'city'
        });
      }

      regions = geography.addEmptyRegions(regions, this._counties, 'county');
      // no sum because we explicitly add it above

      // Add in cities
      regions = regions.concat(cities);

      return regions;
    }
  }
};

export default scraper;
