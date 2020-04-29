import assert from 'assert';
import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch/index.js';
import maintainers from '../../../lib/maintainers.js';
import getKey from '../../../utils/get-key.js';

const labelFragmentsByKey = [
  { cases: 'confirmed cases' },
  { recovered: 'people recovered' },
  { tests: 'tests conducted' }
];

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      name: 'Northern Territory Government - Coronavirus site',
      url: 'https://coronavirus.nt.gov.au'
    }
  ],
  state: 'iso2:AU-NT',
  type: 'table',
  url: 'https://coronavirus.nt.gov.au/',
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    const $trs = $('.header-widget div span, .header-widget p');
    const data = {};
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const [value, ...labelWords] = $tr.text().split(' ');
      const label = labelWords.join(' ');
      const numberInLabel = label.match(/\d/);
      if (!numberInLabel) {
        const key = getKey({ label, labelFragmentsByKey });
        data[key] = parse.number(value);
      }
    });
    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
