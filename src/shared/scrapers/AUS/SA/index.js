import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import getKey from '../_shared/get-key.js';
import maintainers from '../../../lib/maintainers.js';

const labelFragmentsByKey = [{ cases: 'confirmed case' }, { hospitalized: 'icu' }, { deaths: 'deaths' }];

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'SA Government Health Department',
      name: 'SA Health',
      url: 'https://www.sahealth.sa.gov.au'
    }
  ],
  state: 'South Australia',
  type: 'paragraph',
  url:
    'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const paragraph = $('.middle-column p:first-of-type').text();
      const { casesString } = paragraph.match(/been (?<casesString>\d+) confirmed cases/).groups;
      return {
        cases: parse.number(casesString)
      };
    },
    '2020-3-27': async function() {
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const $table = $('table:first-of-type');
      const $trs = $table.find('tbody > tr:not(:first-child)');
      const data = {};
      $trs.each((index, tr) => {
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
