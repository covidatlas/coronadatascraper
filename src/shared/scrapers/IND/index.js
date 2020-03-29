import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';

import populationState from './populationState.json';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'IND',
  url: 'https://www.mohfw.gov.in/', // dashaputra.com/goi
  type: 'table',
  aggregate: 'state',

  // Scrape MOHFW.GOV.IN for State, Cases, Deaths, Recovered
  async scraper() {
    this.url = 'https://www.mohfw.gov.in/';
    const $ = await fetch.page(this.url);

    const $table = $('#cases table');
    const $trs = $table.find('tbody > tr');
    const regions = [];

    $trs.each((index, tr) => {
      const $tr = $(tr);

      if (
        $tr
          .find('td')
          .first()
          .attr('colspan')
      ) {
        // Ignore summary rows
        return;
      }

      const state = parse.string($tr.find('td:nth-child(2)').text());

      const data = {
        state,
        cases: parse.number($tr.find('td:nth-child(3)').text()),
        deaths: parse.number($tr.find('td:nth-child(6)').text()),
        recovered: parse.number($tr.find('td:nth-child(5)').text()),
        population: populationState[state]
      };

      regions.push(data);
    });
    return regions;
  }
};

export default scraper;
