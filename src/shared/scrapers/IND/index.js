import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import populationState from './populationState.json';
import latState from './latState.json';
import longState from './longState.json';

const scraper = {
  country: 'IND',
  url: 'https://www.mohfw.gov.in/',
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
        recovered: parse.number($tr.find('td:nth-child(4)').text()),
        deaths: parse.number($tr.find('td:nth-child(5)').text()),
        population: populationState[state],
        lat: latState[state],
        long: longState[state]
      };
      regions.push(data);
    });
    return regions;
  }
};

export default scraper;
