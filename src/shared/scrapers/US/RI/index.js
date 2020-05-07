import cheerioTableparser from 'cheerio-tableparser';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

const assert = require('assert');

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-RI',
  country: 'iso1:US',
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
      const data = await fetch.csv(this, this.url, 'default');
      const counties = [];
      for (const row of data) {
        const caseHdr = 'Number of  COVID-19 positive (including presumptive positive) cases';

        const county = geography.addCounty(row.County);
        const cases = parse.number(row[caseHdr]);

        // skip the last updated timestamp row
        if (county.includes('last updated')) {
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
    '2020-03-29': async function() {
      const cities = [];
      let regions = [];

      this.headless = true;
      this.url = 'https://health.ri.gov/data/covid-19/';
      const $ = await fetch.headless(this, this.url, 'default');
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
    },
    '2020-04-29': async function() {
      // The main RI site https://health.ri.gov/data/covid-19/ loads
      // and then appears to make an Ajax call to load another
      // iframe. The main page also has some data, but the iframe's
      // data appears -- to me (jz) -- to be more up-to-date, so we're
      // only going to scrape the iframe source.
      //
      // TODO DURING PORT: add "Inconsistent page data: only scraping
      // iframe" to crawl caveats.

      // Get the internal iframe URL from the containing page.
      this.url = 'https://health.ri.gov/data/covid-19/';
      const tmp = await fetch.page(this, this.url, 'tmpindex');
      const iframeUrlRE = /\[\{"component":\{"name":"iframe-card","settings":\{"src":"(.*?)"/;
      const m = tmp.html().match(iframeUrlRE);
      if (!m) {
        throw new Error(`Couldn't find actual URL, no match for ${iframeUrlRE}`);
      }
      const actualUrl = m[1];
      // console.log(`Loading actual URL ${actualUrl}`);

      this.headless = true;
      const $ = await fetch.headless(this, actualUrl, 'default');
      // console.log($.html());

      // Find entries, throws if doesn't find at least one.
      const findMany = (el, selector) => {
        const ret = el.find(selector);
        if (ret.length === 0) {
          const msg = `No match for ${selector}`;
          throw new Error(msg);
        }
        return ret;
      };

      // Find entry, throws if not exactly one.
      const findOne = (el, selector) => {
        const ret = findMany(el, selector);
        if (ret.length !== 1) {
          const msg = `Should have 1 match for ${selector}, got ${ret.length} (${ret.text()})`;
          throw new Error(msg);
        }
        return ret;
      };

      /** Key-value dict, eg 'Total Cases' = 2345. */
      const headingData = {};

      /** Headings down lhs of the page. */
      const sideHeadings = ['Total Tested', 'Total Negative Cases', 'Total Positive Cases', 'Total Fatalities'];
      sideHeadings.forEach(h => {
        const divs = findMany($.root(), `lego-table > div.table:contains('${h}')`);
        // Gross hack.  The page contains both "Total Tested" and
        // "Total Tested Prior Day", so the selector finds both of
        // these values.  The full div text is actually a
        // concatenation of all values, and the next value is 'No
        // data', so checking for that, as it disambiguates "Total
        // TestedNo Data" and "Total Tested Prior DayNo Data".
        let div = divs.toArray().filter(d =>
          $(d)
            .text()
            .includes(`${h}No data`)
        );
        assert.equal(div.length, 1, 'exactly 1 heading matches.');
        div = $(div[0]);

        const rows = findOne(div, 'div.tableBody > div.row');
        const data = rows.text().replace(/,/, '');
        headingData[h] = data;
      });

      /** Hospitalization data, transposed and added to headingData. */
      const hospdiv = findOne($.root(), `lego-table > div.table:contains('Currently Hospitalized')`);
      const ths = findMany(hospdiv, 'div.headerRow > div.headerCell > div.headerContentDiv > div.colName');
      const headings = ths.toArray().map(th => $(th).text());
      const expectedHospHeadings = [
        'Currently Hospitalized',
        'Currently in ICU',
        'On Ventilator',
        'Hospital Discharges'
      ];
      assert.deepEqual(expectedHospHeadings.sort(), headings.sort());
      const hospRows = findOne(hospdiv, 'div.tableBody > div.row');
      const rowcells = findMany(hospRows, 'div.cell');
      const hospvalues = rowcells.toArray().map(c => $(c).text());
      if (headings.length !== hospvalues.length)
        throw new Error(`Different number of headings (${headings.join(',')}) than values (${hospvalues.join(',')})`);
      for (let i = 0; i < headings.length; i++) {
        headingData[headings[i]] = hospvalues[i];
      }

      /** City/Town data. */
      const citydiv = findOne($.root(), "lego-table > div.table:contains('City/Town')");
      const cityths = findMany(citydiv, 'div.headerRow > div.headerCell > div.headerContentDiv > div.colName');
      const cityheadings = cityths.toArray().map(th => $(th).text());
      const expectedCityHeadings = [/City\/Town/, /Positive Cases/];
      for (let i = 0; i < cityheadings.length; i++) {
        const ch = cityheadings[i];
        const re = expectedCityHeadings[i];
        assert(ch.match(re), `Heading ${ch} matches ${re}`);
      }
      const cityRaw = findMany(citydiv, 'div.tableBody > div.row')
        .toArray()
        .map(r => {
          const rowcells = findMany($(r), 'div.cell');
          const values = rowcells.toArray().map(c => $(c).text());
          if (cityheadings.length !== values.length)
            throw new Error(
              `Different number of headings (${cityheadings.join(',')}) than values (${values.join(',')})`
            );
          return rowcells.toArray().map(c => $(c).text());
        });

      // console.log(headingData);
      // console.log(cityRaw);

      /** Get the headingData key value, throw if missing. */
      function getRawHeaderValue(key) {
        if (!headingData[key]) throw new Error(`Missing heading ${key}`);
        return parseInt(headingData[key], 10);
      }

      /* TODO - verify the aggregate of this data. Copied from earlier entry. Should it be 'state'? */
      const stateData = {
        tested: getRawHeaderValue('Total Tested'),
        cases: getRawHeaderValue('Total Positive Cases'),
        deaths: getRawHeaderValue('Total Fatalities'),
        hospitalized: getRawHeaderValue('Currently Hospitalized'),
        discharged: getRawHeaderValue('Hospital Discharges'),
        aggregate: 'county'
      };

      let regions = [];

      regions.push(stateData);

      const countyCases = {};
      for (const county of this._counties) {
        countyCases[county] = 0;
      }

      const numRows = cityRaw.length;
      const cities = [];
      for (let i = 0; i < numRows; i++) {
        const city = cityRaw[i][0];
        let cases = cityRaw[i][1];
        if (cases === '<5') {
          cases = 3; // pick something!
        } else {
          cases = parseInt(cases, 10);
        }

        // console.log('CITY: ' + city);
        // console.log('CITY MAP LKP: ' + this._cities[city]);
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

      // console.log(regions);

      return regions;
    }
  }
};

export default scraper;
