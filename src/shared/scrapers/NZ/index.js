// import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
// import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const countryLevelMap = {
  Auckland: 'iso2:NZ-AUK',
  'Bay of Plenty': 'iso2:NZ-BOP',
  Canterbury: 'iso2:NZ-CAN',
  // 'Capital and Coast': 'iso2:NZ-?',
  // 'Counties Manukau': 'iso2:NZ-?',
  "Hawke's Bay": 'iso2:NZ-HKB',
  // 'Hutt Valley': 'iso2:NZ-?',
  // Lakes: 'iso2:NZ-?',
  // MidCentral: 'iso2:NZ-?',
  // 'Nelson Marlborough': 'iso2:NZ-?',
  Northland: 'iso2:NZ-NTL',
  // 'South Canterbury': 'iso2:NZ-?',
  // Southern: 'iso2:NZ-?',
  // Tairāwhiti: 'iso2:NZ-?',
  Taranaki: 'iso2:NZ-TKI',
  Waikato: 'iso2:NZ-WKO',
  // Wairarapa: 'iso2:NZ-?',
  // Waitemata: 'iso2:NZ-?',
  'West Coast': 'iso2:NZ-WTC'
  // Whanganui: 'iso2:NZ-?'
};

const scraper = {
  aggregate: 'state',
  country: 'iso1:NZ',
  maintainer: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'New Zealand Government Ministry of Health',
      name: 'New Zealand Government Ministry of Health',
      url: 'https://www.health.gov.au/'
    }
  ],
  type: 'table',
  url:
    'https://www.health.govt.nz/our-work/diseases-and-conditions/covid-19-novel-coronavirus/covid-19-current-situation/covid-19-current-cases',
  async scraper() {
    const states = [];
    const $ = await fetch.page(this.url);
    const $tableBody = $('table > caption:contains("Total cases by DHB") + thead + tbody');
    const $trs = $tableBody.find('tr:not(:last-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const state = parse.string($tr.find('td:first-child').text());
      const cases = parse.number($tr.find('td:nth-child(2)').text());

      const stateMapped = countryLevelMap[state];
      // assert(stateMapped, `${state} not found in countryLevelMap`);

      states.push({
        state: stateMapped,
        cases
      });
    });
    // const summedData = transform.sumData(states);
    // states.push(summedData);

    // assert(summedData > 0, 'Total is not reasonable');
    return states;
  }
};

export default scraper;
