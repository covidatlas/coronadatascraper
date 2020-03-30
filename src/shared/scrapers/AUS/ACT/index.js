import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';

/**
 * @param {string} rowLabel
 */
const getKey = rowLabel => {
  const lowerLabel = rowLabel.toLowerCase();
  if (lowerLabel.includes('confirmed case')) {
    return 'cases';
  }
  if (lowerLabel.includes('tested negative')) {
    return 'tested';
  }
  if (lowerLabel.includes('recovered')) {
    return 'recovered';
  }
  throw new Error(`There is a row we are not expecting: ${lowerLabel}`);
};

const pivotTheTable = ($trs, $) => {
  const dataPairs = [];
  $trs.each((trIndex, tr) => {
    const $tr = $(tr);
    const $tds = $tr.find('td, th');
    $tds.each((tdIndex, td) => {
      const $td = $(td);
      dataPairs[tdIndex] = dataPairs[tdIndex] || [];
      dataPairs[tdIndex][trIndex] = $td.text();
    });
  });
  return dataPairs;
};

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'ACT Government Health Department',
      name: 'ACT Government Health',
      url: 'https://www.health.act.gov.au'
    }
  ],
  state: 'Australian Capital Territory',
  type: 'table',
  url: 'https://www.covid19.act.gov.au/updates/confirmed-case-information',
  scraper: {
    '0': async function() {
      const $ = await fetch.page('https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19');
      const $table = $('.statuscontent');
      const $trs = $table.find('div');
      const data = {
        deaths: 0,
        recovered: 0,
        state: this.state
      };
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const [label, value] = $tr.text().split(': ');
        const key = getKey(label);
        data[key] = parse.number(value);
      });
      if (data.tested > 0) {
        data.tested += data.cases; // `tested` is only tested negative in this table, add the positive tested.
      }
      assert(data.cases > 0, 'Cases is not reasonable');
      return data;
    },
    '2020-3-29': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('h2:contains("Cases") + table');
      const $trs = $table.find('tr');

      const dataPairs = pivotTheTable($trs, $);

      const data = {
        deaths: 0,
        recovered: 0,
        state: this.state
      };
      dataPairs.forEach(([label, value]) => {
        const key = getKey(label);
        data[key] = parse.number(value);
      });

      if (data.tested > 0) {
        data.tested += data.cases; // `tested` is only tested negative in this table, add the positive tested.
      }
      assert(data.cases > 0, 'Cases is not reasonable');
      return data;
    }
  }
};

export default scraper;
