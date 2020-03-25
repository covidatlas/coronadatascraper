import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'RI',
  country: 'USA',
  priority: 1,
  type: 'csv',
  aggregate: 'county',
  // This google sheet is linked from the HTML of https://health.ri.gov/data/covid-19/
  // It is used to render the little table of state totals, but contains a per-count tab
  url:
    'https://docs.google.com/spreadsheets/d/1n-zMS9Al94CPj_Tc3K7Adin-tN9x1RSjjx2UzJ4SV7Q/gviz/tq?tqx=out:csv&sheet=County+Data#gid=0',

  async scraper() {
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

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
