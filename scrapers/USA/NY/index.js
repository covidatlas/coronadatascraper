import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'NY',
  country: 'USA',
  type: 'table',
  aggregate: 'county',
  _countyMap: {
    'New York City': 'New York County',
    Broom: 'Broome'
  },
  async scraper() {
    this.url = datetime.scrapeDateIsBefore('2020-3-17') ? 'https://www.health.ny.gov/diseases/communicable/coronavirus/' : 'https://coronavirus.health.ny.gov/county-county-breakdown-positive-cases';
    const counties = [];
    const $ = await fetch.page(this.url);
    let $table;
    if (datetime.scrapeDateIsBefore('2020-3-17')) {
      $table = $('#case_count_table');
    } else {
      $table = $('table').first();
    }
    const $trs = $table.find('tr:not(.total_row):not(:first-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      let countyName = parse.string($tr.find('td:first-child').text()).replace(':', '');
      countyName = this._countyMap[countyName] || countyName;
      if (countyName !== 'New York State (Outside of NYC)' && countyName !== 'Total Positive Cases (Statewide)') {
        counties.push({
          county: transform.addCounty(countyName),
          cases: parse.number($tr.find('td:last-child').text())
        });
      }
    });
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
