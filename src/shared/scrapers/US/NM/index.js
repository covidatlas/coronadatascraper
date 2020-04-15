import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-NM',
  country: 'iso1:US',
  sources: [
    {
      url: 'https://cv.nmhealth.org',
      name: 'New Mexico Department of Health'
    }
  ],
  url: 'https://cv.nmhealth.org/cases-by-county/',
  type: 'table',
  headless: false,
  aggregate: 'county',

  async scraper() {
    const counties = [];
    const $ = await fetch.page(this, this.url, 'default');
    const $table = $('td:contains("County")').closest('table');
    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const cases = parse.number(
        $tr
          .find('td')
          .eq(1)
          .text()
      );
      const deathText = $tr
        .find('td')
        .eq(2)
        .text();

      let deaths;
      if (deathText) {
        if (deathText === '—') {
          deaths = 0;
        } else {
          deaths = parse.number(deathText);
        }
      }

      const county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));

      if (index < 1) {
        return;
      }

      counties.push({
        county,
        cases,
        deaths
      });
    });

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
