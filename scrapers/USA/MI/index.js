import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MI',
  country: 'USA',
  url: 'https://www.michigan.gov/coronavirus/0,9753,7-406-98163-520743--,00.html',
  type: 'table',
  aggregate: 'county',

  async scraper() {
    // The webpage breaks out Detroit, which is in Wayne County.
    // The table does not include Detroit's numbers in the Wayne County totals.
    // So we have to roll that up ourselves.
    let detroitCases = 0;
    let detroitDeaths = 0;

    const $ = await fetch.page(this.url);

    const $cap = $('caption:contains("Overall Confirmed COVID-19 Cases by County")');
    const $table = $cap.closest('table');
    const $trs = $table.find('tbody > tr');

    const counties = [];

    $trs.each((index, tr) => {
      const $tr = $(tr);

      let cases = parse.number(parse.string($tr.find('> *:nth-child(2)').text()) || 0);
      let deaths = parse.number(parse.string($tr.find('> *:last-child').text()) || 0);
      let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));

      // Remember these to add them to Wayne County instead
      if (county === 'Detroit City County') {
        detroitCases = cases;
        detroitDeaths = deaths;
        return;
      }
      if (county === 'Wayne County') {
        cases += detroitCases;
        deaths += detroitDeaths;
      }

      if (county === 'Out of State County') {
        county = UNASSIGNED;
      }
      if (index < 1 || index > $trs.get().length - 2) {
        return;
      }

      // console.log(county, cases, deaths);

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
