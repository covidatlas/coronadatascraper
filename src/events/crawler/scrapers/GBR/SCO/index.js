import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'GBR',
  state: 'Scotland',
  url: 'https://www.gov.scot/coronavirus-covid-19/',
  aggregate: 'county',
  type: 'table',
  async scraper() {
    function findText(node) {
      const immediateChild = node.children[0];
      const isText = immediateChild.type === 'text';
      return isText ? immediateChild.data : findText(immediateChild);
    }

    const counties = [];
    const $ = await fetch.page(this.url);
    const $table = $('tbody').first();
    $table.children('tr').each((i, item) => {
      const columns = $(item).children('td');
      const name = findText(columns[0]);
      const confirmedCases = findText(columns[1]);
      counties.push({
        county: name,
        cases: parse.number(confirmedCases)
      });
    });
    return counties;
  }
};

export default scraper;
