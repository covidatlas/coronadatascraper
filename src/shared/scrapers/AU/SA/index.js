import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import getKey from '../../../utils/get-key.js';
import maintainers from '../../../lib/maintainers.js';

const labelFragmentsByKey = [
  { cases: 'confirmed case' },
  { deaths: 'deaths' },
  { hospitalized: 'icu' },
  { recovered: 'cases cleared' }
];

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'SA Government Health Department',
      name: 'SA Health',
      url: 'https://www.sahealth.sa.gov.au'
    }
  ],
  state: 'iso2:AU-SA',
  type: 'table',
  url:
    'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const paragraph = $('.middle-column p:first-of-type').text();
      const { casesString } = paragraph.match(/been (?<casesString>\d+) confirmed cases/).groups;
      this.type = 'paragraph';
      return {
        cases: parse.number(casesString)
      };
    },
    '2020-03-27': async function() {
      this.type = 'table';
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('table:first-of-type');
      const $trs = $table.find('tbody > tr');
      const data = {};

      $trs
        .filter((_index, tr) => Boolean($(tr).find('td').length)) // Had `th` inside `tbody`, now they are inside `thead`. This suits both.
        .each((_index, tr) => {
          const $tr = $(tr);
          const key = getKey({ label: $tr.find('td:first-child').text(), labelFragmentsByKey });
          data[key] = parse.number($tr.find('td:last-child').text());
        });
      assert(data.cases > 0, 'Cases is not reasonable');
      return data;
    }
  }
};

export default scraper;
