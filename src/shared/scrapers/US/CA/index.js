import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'CA',
  country: 'iso1:US',
  priority: 1,
  type: 'csv',
  aggregate: 'county',
  curators: [
    {
      name: 'The Mercury News',
      email: 'hattierowan@gmail.com',
      twitter: '@hattierowan',
      github: 'HarrietRowan'
    }
  ],
  _counties: [
    'Alameda County',
    'Alpine County',
    'Amador County',
    'Butte County',
    'Calaveras County',
    'Colusa County',
    'Contra Costa County',
    'Del Norte County',
    'El Dorado County',
    'Fresno County',
    'Glenn County',
    'Humboldt County',
    'Imperial County',
    'Inyo County',
    'Kern County',
    'Kings County',
    'Lake County',
    'Lassen County',
    'Los Angeles County',
    'Madera County',
    'Marin County',
    'Mariposa County',
    'Mendocino County',
    'Merced County',
    'Modoc County',
    'Mono County',
    'Monterey County',
    'Napa County',
    'Nevada County',
    'Orange County',
    'Placer County',
    'Plumas County',
    'Riverside County',
    'Sacramento County',
    'San Benito County',
    'San Bernardino County',
    'San Diego County',
    'San Francisco County',
    'San Joaquin County',
    'San Luis Obispo County',
    'San Mateo County',
    'Santa Barbara County',
    'Santa Clara County',
    'Santa Cruz County',
    'Shasta County',
    'Sierra County',
    'Siskiyou County',
    'Solano County',
    'Sonoma County',
    'Stanislaus County',
    'Sutter County',
    'Tehama County',
    'Trinity County',
    'Tulare County',
    'Tuolumne County',
    'Ventura County',
    'Yolo County',
    'Yuba County'
  ],
  _processData(data) {
    const counties = [];
    for (const stateData of data) {
      const stateObj = { county: geography.addCounty(stateData.county) };
      if (stateData.cases !== '') {
        stateObj.cases = parse.number(stateData.cases);
      }
      if (stateData.tested !== '') {
        stateObj.tested = parse.number(stateData.tested);
      }
      if (stateData.recovered !== '') {
        stateObj.recovered = parse.number(stateData.recovered);
      }
      if (stateData.deaths !== '') {
        stateObj.deaths = parse.number(stateData.deaths);
      }
      counties.push(stateObj);
    }
    counties.push(transform.sumData(counties));
    return counties;
  },
  async _fetchLatest() {
    this.url =
      'https://docs.google.com/spreadsheets/d/1CwZA4RPNf_hUrwzNLyGGNHRlh1cwl8vDHwIoae51Hac/gviz/tq?tqx=out:csv&sheet=master';
    const data = await fetch.csv(this.url);
    return this._processData(data);
  },
  scraper: {
    '0': async function() {
      return this._fetchLatest();
    },
    '2020-04-01': async function() {
      this.url =
        'https://data.chhs.ca.gov/dataset/6882c390-b2d7-4b9a-aefa-2068cee63e47/resource/6cd8d424-dfaa-4bdd-9410-a3d656e1176e/download/covid19data.csv';
      const scrapeDate = new Date(datetime.scrapeDate() || datetime.today.at('America/Los_Angeles'));
      scrapeDate.setDate(scrapeDate.getDate() - 1);

      const $ = await fetch.page(this.url, scrapeDate, { alwaysRun: true });

      const csvURL = $('a').text();
      const data = await fetch.csv(csvURL, scrapeDate, { alwaysRun: true });

      const counties = [];
      const found = new Set();

      data.reverse().forEach(location => {
        const name = location['County Name'];
        if (datetime.dateIsEqualTo(scrapeDate, location['Most Recent Date']) && !found.has(name)) {
          counties.push({
            county: name.includes('Unassigned') ? UNASSIGNED : geography.addCounty(name),
            cases: parse.number(location['Total Count Confirmed']),
            deaths: parse.number(location['Total Count Deaths']),
            hospitalized: parse.number(location['COVID-19 Positive Patients'])
          });
          found.add(name);
        }
      });

      counties.push(transform.sumData(counties));
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
