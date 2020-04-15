import { DeprecatedError } from '../../lib/errors.js';
import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:RU',
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
    '2020-03-26': async function() {
      const csrfRequestResponse = await fetch.jsonAndCookies(this, this.url, 'tmpcsrf');
      const csrfCookies = csrfRequestResponse.cookies;
      const { csrfToken } = csrfRequestResponse.body;

      const finalUrl = `${this.url}${csrfToken}`;
      const opts = { cookies: csrfCookies };
      const { data } = await fetch.json(this, finalUrl, 'default', undefined, opts);

      const ruEntries = data.items.filter(({ ru }) => ru);

      const out = ruEntries.map(({ name, cases, cured: recovered, deaths }) => ({
        // The list contains data at federal subject level, which is the top-level political
        // divisions (including cities of Moscow and St Petersburg)
        state: mapping[name],
        cases,
        recovered,
        deaths
      }));

      if (out.length > 0) out.push(transform.sumData(out));

      return out;
    }
  }
};

export default scraper;
