import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'USA',
  url: 'https://covidtracking.com/api/states',
  type: 'json',
  curators: [
    {
      name: 'The COVID Tracking Project',
      url: 'https://covidtracking.com/',
      twitter: '@COVID19Tracking',
      github: 'COVID19Tracking'
    }
  ],
  aggregate: 'state',
  priority: -0.5,
  async scraper() {
    const data = await fetch.json(this.url);

    const regions = [];

    for (const stateData of data) {
      const stateObj = {
        state: stateData.state
      };
      if (stateData.death !== null) {
        stateObj.deaths = parse.number(stateData.death);
      }
      if (stateData.total !== null) {
        stateObj.tested = parse.number(stateData.total);
      }
      // Assume zero if none provided
      stateObj.cases = parse.number(stateData.positive || 0);
      regions.push(stateObj);
    }

    regions.push(transform.sumData(regions));

    return regions;
  }
};

export default scraper;
