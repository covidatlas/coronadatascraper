import * as fetch from '../../lib/fetch.js';
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
  priority: 1,
  async scraper() {
    const data = await fetch.json(this.url);

    const regions = [];

    for (const stateData of data) {
      const stateObj = {
        state: stateData.state,
        cases: parse.number(stateData.positive),
        tested: parse.number(stateData.total)
      };
      if (stateData.death !== null) {
        stateObj.deaths = parse.number(stateData.death);
      }
      regions.push(stateObj);
    }

    regions.push(transform.sumData(regions));

    return regions;
  }
};

export default scraper;
