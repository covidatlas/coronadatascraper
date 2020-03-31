import needle from 'needle';
import { DeprecatedError } from '../../lib/errors.js';
import * as fetch from '../../lib/fetch/index.js';

import populations from './populations.json';

// Remap some of the mismatching or ambiguous names
const POPULATION_REMAP = {
  'Архангельская область': 'Архангельская область без Ненецкого автономного округа',
  'Тюменская область': 'Тюменская область без автономных округов',
  'Ханты-Мансийский АО': 'Ханты-Мансийский автономный округ-Югра'
};

const scraper = {
  country: 'RUS',
  aggregate: 'state',
  url: 'https://yandex.ru/maps/api/covid?csrfToken=',
  type: 'json',
  curators: [{ name: 'Yandex', url: 'https://yandex.ru' }],
  sources: [
    {
      description:
        'Data provided by Rospotrebnadzor (Federal Service for Surveillance on Consumer Rights Protection and Human Wellbeing)',
      name: 'Rospotrebnadzor',
      url: 'https://www.rospotrebnadzor.ru/'
    }
  ],
  maintainers: [
    {
      name: 'Arseniy Ivanov',
      twitter: '@freeatnet',
      github: 'freeatnet',
      email: 'arseniy+coronadatascraper@freeatnet.com'
    }
  ],
  scraper: {
    '0': function() {
      throw new DeprecatedError('RUS scraper did not exist for this date');
    },
    '2020-3-26': async function() {
      const csrfRequestResponse = await needle('get', this.url, {}, { parse_response: true });
      const csrfCookies = csrfRequestResponse.cookies;
      const { csrfToken } = csrfRequestResponse.body;

      const { data } = await fetch.json(`${this.url}${csrfToken}`, undefined, { cookies: csrfCookies });

      const ruEntries = data.items.filter(({ ru }) => ru);
      return ruEntries
        .map(({ name, cases, cured: recovered, deaths, coordinates }) => ({
          // The list contains data at federal subject level, which is the top-level political
          // divisions (including cities of Moscow and St Petersburg)
          state: name,
          cases,
          recovered,
          deaths,
          coordinates
        }))
        .map(entry => {
          const { state } = entry;
          const populationKey = state in POPULATION_REMAP ? POPULATION_REMAP[state] : state;
          const populationObject = populations.find(({ state: key }) => key === populationKey);

          return populationObject ? { ...entry, population: populationObject.population } : entry;
        });
    }
  }
};

export default scraper;
