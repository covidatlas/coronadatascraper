import path from 'path';
import * as fs from '../lib/fs.js';
import * as fetch from '../lib/fetch.js';
import * as parse from '../lib/parse.js';
import * as geography from '../lib/geography.js';
import * as datetime from '../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'USA',
  priority: -1,
  type: 'csv',
  aggregate: 'county',
  url: 'https://docs.google.com/spreadsheets/d/15_AwWsMhlNprGHLk-ycj5NvrcaaYX0pEmyg-qPoAQkc/gviz/tq?tqx=out:csv&sheet=Master%20-%20Timeseries',
  curators: [
    {
      name: 'Sara Llanes',
      email: 'sara.llanes@columbia.edu',
      twitter: '@SaraLlanes'
    }
  ],
  async scraper() {
    const counties = await fs.readCSV(path.join('coronavirus-data-sources', 'population', 'population-usa-counties.csv'));
    const data = await fetch.csv(this.url);
    let regions = [];
    
    const scrapeDate = process.env.SCRAPE_DATE ? datetime.getMDYYYY(process.env.SCRAPE_DATE) : datetime.getMDYYYY();

    let foundStates = {};

    for (let dataObj of data) {
      if (dataObj.Date !== scrapeDate) {
        continue;
      }

      foundStates[parse.string(dataObj.State)] = true;

      let regionObj = {
        state: parse.string(dataObj.State),
        county: geography.addCounty(parse.string(dataObj.County)),
        cases: parse.number(dataObj.Cases || 0),
        deaths: parse.number(dataObj.Death || 0),
        tested: parse.number(dataObj.Tested || 0),
        recovered: parse.number(dataObj.Recovered || 0)
      };
      regions.push(regionObj);
    }

    // Get a hash of state counties
    let countiesByState = {};
    for (let countyInfo of counties) {
      let [county, state] = countyInfo.name.split(', ');
      countiesByState[state] = countiesByState[state] || [];
      countiesByState[state].push(county);
    }

    // Add empty counties
    for (let state in foundStates) {
      regions = geography.addEmptyRegions(regions, countiesByState[state], 'county', { state: state });
    }

    return regions;
  }
};

export default scraper;
