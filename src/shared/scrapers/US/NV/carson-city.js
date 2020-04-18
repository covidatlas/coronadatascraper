import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';
const scraper = {
  state: 'iso2:US-NV',
  country: 'iso1:US',
  aggregate: 'county',
  url: 'https://gethealthycarsoncity.org/novel-coronavirus-2019/',
  sources: [
    {
      name: 'Carson City Health and Human Services',
      url: 'https://gethealthycarsoncity.org/',
      description:
        'Carson City Health and Human Services - Aggregate data for the Quad County region: Carson City, Douglas, Lyon, and Storey counties.'
    }
  ],
  certValidation: false,
  type: 'table',
  async scraper() {
    const counties = [];
    const $ = await fetch.page(this, this.url, 'default');
    const $table = $('table');
    const $trs = $table.find('tbody > tr:not(:first-child)');

    $trs.each((index, tr) => {
      const $tr = $(tr);
      const name = parse.string($tr.find('td:first-child').text());
      if (name === 'TOTAL') {
        return;
      }
      counties.push({
        county: name,
        cases: parse.number($tr.find('td:nth-child(2)').text()),
        active: parse.number($tr.find('td:nth-child(3)').text()),
        recovered: parse.number($tr.find('td:nth-child(4)').text()),
        deaths: parse.number($tr.find('td:last-child').text())
      });
    });

    return counties;
  }
};

export default scraper;
