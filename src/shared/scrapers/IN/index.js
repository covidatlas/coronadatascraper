import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import getKey from '../../utils/get-key.js';

const labelFragmentsByKey = [
  { state: 'name of state' },
  { deaths: 'death' },
  { cases: 'total confirmed cases' },
  { recovered: 'cured' },
  { discard: 's. no.' }
];

const countryLevelMap = {
  'Andaman and Nicobar Islands': 'iso2:IN-AN',
  'Andhra Pradesh': 'iso2:IN-AP',
  'Arunachal Pradesh': 'iso2:IN-AR',
  Assam: 'iso2:IN-AS',
  Bihar: 'iso2:IN-BR',
  Chandigarh: 'iso2:IN-CH',
  Chhattisgarh: 'iso2:IN-CT',
  'Dadra and Nagar Haveli': 'iso2:IN-DN',
  'Daman and Diu': 'iso2:IN-DD',
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
  Lakshadweep: 'iso2:IN-LD',
  'Madhya Pradesh': 'iso2:IN-MP',
  Maharashtra: 'iso2:IN-MH',
  Manipur: 'iso2:IN-MN',
  Meghalaya: 'iso2:IN-ML',
  Mizoram: 'iso2:IN-MZ',
  Nagaland: 'iso2:IN-NL',
  Odisha: 'iso2:IN-OR',
  Puducherry: 'iso2:IN-PY',
  Punjab: 'iso2:IN-PB',
  Rajasthan: 'iso2:IN-RJ',
  Sikkim: 'iso2:IN-SK',
  'Tamil Nadu': 'iso2:IN-TN',
  Telengana: 'iso2:IN-TG', // The site is using this spelling
  Telangana: 'iso2:IN-TG', // country-levels-export uses this spelling
  Tripura: 'iso2:IN-TR',
  'Uttar Pradesh': 'iso2:IN-UP',
  Uttarakhand: 'iso2:IN-UT',
  'West Bengal': 'iso2:IN-WB'
};

const getValue = (key, text) => {
  if (key === 'state') {
    const state = parse.string(text).replace(/#/, '');
    const mappedState = countryLevelMap[state];
    assert(
      mappedState,
      `${state} not found in countryLevelMap, look up on https://github.com/hyperknot/country-levels-export/blob/master/docs/iso2_list/IN.md`
    );
    return mappedState;
  }
  return parse.number(text);
};

const scraper = {
  country: 'iso1:IN',
  url: 'https://www.mohfw.gov.in/',
  type: 'table',
  aggregate: 'state',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('#state-data');
    assert.equal($table.length, 1, 'The table can not be found');

    const $headings = $table.find('thead tr th');
    const dataKeysByColumnIndex = [];
    $headings.each((index, heading) => {
      const $heading = $(heading);
      dataKeysByColumnIndex[index] = getKey({ label: $heading.text(), labelFragmentsByKey });
    });

    const states = [];
    const $trs = $table.find('tbody > tr');
    $trs
      .filter(
        // Remove summary rows
        (_rowIndex, tr) =>
          !$(tr)
            .find('td')
            .first()
            .attr('colspan')
      )
      .each((_rowIndex, tr) => {
        const $tds = $(tr).find('td');
        const data = {};

        $tds.each((columnIndex, td) => {
          const $td = $(td);

          const key = dataKeysByColumnIndex[columnIndex];
          data[key] = getValue(key, $td.text());
        });
        states.push(data);
      });

    const summedData = transform.sumData(states);
    states.push(summedData);
    assert(summedData.cases > 0, 'Cases is not reasonable');

    return states;
  }
};

export default scraper;
