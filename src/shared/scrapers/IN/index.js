import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';

import populationState from './populationState.json';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const countryLevelMap = {
  'Andhra Pradesh': 'iso2:IN-AP',
  'Andaman and Nicobar Islands': 'iso2:IN-AN',
  'Arunachal Pradesh': 'iso2:IN-AR',
  Assam: 'iso2:IN-AS',
  Bihar: 'iso2:IN-BR',
  Chandigarh: 'iso2:IN-CH',
  Chhattisgarh: 'iso2:IN-CT',
  Delhi: 'iso2:IN-DL',
  Goa: 'iso2:IN-GA',
  Gujarat: 'iso2:IN-GJ',
  Haryana: 'iso2:IN-HR',
  'Himachal Pradesh': 'iso2:IN-HP',
  'Jammu and Kashmir': 'iso2:IN-JK',
  Jharkhand: 'iso2:IN-JH',
  Karnataka: 'iso2:IN-KA',
  Kerala: 'iso2:IN-KL',
  Ladakh: 'iso2:IN-LA',
  'Madhya Pradesh': 'iso2:IN-MP',
  Maharashtra: 'iso2:IN-MH',
  Manipur: 'iso2:IN-MN',
  Mizoram: 'iso2:IN-MZ',
  Odisha: 'iso2:IN-OR',
  Puducherry: 'iso2:IN-PY',
  Punjab: 'iso2:IN-PB',
  Rajasthan: 'iso2:IN-RJ',
  'Tamil Nadu': 'iso2:IN-TN',
  Telengana: 'iso2:IN-TG',
  Uttarakhand: '-', //'iso2:IN-UT',
  'Uttar Pradesh': 'iso2:IN-UP',
  'West Bengal': 'iso2:IN-WB',
  Tripura: 'IN-TR'
};

const scraper = {
  country: 'iso1:IN',
  url: 'https://www.mohfw.gov.in/', // dashaputra.com/goi
  type: 'table',
  aggregate: 'state',

  // Scrape MOHFW.GOV.IN for State, Cases, Deaths, Recovered
  async scraper() {
    this.url = 'https://www.mohfw.gov.in/';
    const $ = await fetch.page(this.url);

    const $table = $('#state-data');
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
      const stateMapped = countryLevelMap[state];
      assert(
        stateMapped,
        `${state} not found in countryLevelMap, look up on https://github.com/hyperknot/country-levels/blob/master/docs/iso2_list/IN.md`
      );
      if (stateMapped === '-') {
        return;
      }

      const data = {
        stateMapped,
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
