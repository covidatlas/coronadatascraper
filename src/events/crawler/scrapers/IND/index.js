import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as rules from '../../lib/rules.js';
import populationState from './populationState.json';

const scraper = {
  country: 'IND',
  url: 'https://www.mohfw.gov.in/',
  type: 'table',
  aggregate: 'state',

  async scraper() {
    this.url = 'https://www.mohfw.gov.in/';
    const $ = await fetch.page(this.url);

    const $table = $('table[style="font-weight:bold"]');
    $('table tr')
      .slice(-2)
      .remove();
    const $trs = $table.find('tbody > tr');
    const regions = [];

    $trs.each((index, tr) => {
      const $tr = $(tr);

      const state = parse.string($tr.find('td:nth-child(2)').text());

      const data = {
        state,
        cases: parse.number($tr.find('td:nth-child(3)').text()),
        deaths: parse.number($tr.find('td:nth-child(6)').text()),
        recovered: parse.number($tr.find('td:nth-child(5)').text()),
        population: populationState[state]
      };
      if (rules.isAcceptable(data, null, this._reject)) {
        regions.push(data);
      }
    });
    return regions;
  }
};

export default scraper;
