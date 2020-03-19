import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import * as rules from '../../lib/rules.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'ESP',
  url: 'https://opendata.arcgis.com/datasets/48fac2d7de0f43f9af938852e3748845_0.csv',
  priority: 1,
  aggregate: 'state',
  async scraper() {
    const data = await fetch.csv(this.url);
    const states = [];
    for (const row of data) {
      const state = row.Texto !== undefined ? parse.string(row.Texto) : '';
      const cases = row.TotalConfirmados !== undefined ? parse.number(row.TotalConfirmados) : 0;
      const deaths = row.TotalFallecidos !== undefined ? parse.number(row.TotalFallecidos) : 0;
      const recovered = row.TotalRecuperados !== undefined ? parse.number(row.TotalRecuperados) : 0;
      if (state !== '') {
        const data = {
          state,
          cases,
          deaths,
          recovered
        };
        if (rules.isAcceptable(data, null, this._reject)) {
          states.push(data);
        }
      }
    }
    states.push(transform.sumData(states));
    return states;
  }
};

export default scraper;
