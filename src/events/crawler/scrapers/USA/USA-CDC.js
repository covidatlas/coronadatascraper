import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as geography from '../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'USA',
  url: 'https://www.cdc.gov/coronavirus/2019-ncov/map-data-cases.csv',
  _getCaseNumber(string) {
    if (typeof string === 'string') {
      const matches = string.match(/(\d+) of (\d+)/);
      if (string === 'None') {
        return 0;
      }
      if (matches) {
        return parse.number(matches[2]);
      }
      return parse.number(string);
    }
    return string;
  },
  async _scraper() {
    const data = await fetch.csv(this.url);
    const states = [];
    for (const stateData of data) {
      if (stateData.Name) {
        states.push({
          state: geography.toUSStateAbbreviation(parse.string(stateData.Name)),
          cases: this._getCaseNumber(stateData['Cases Reported'])
        });
      }
    }
    return states;
  }
};

export default scraper;
