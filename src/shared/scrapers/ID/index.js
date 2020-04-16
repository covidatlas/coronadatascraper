import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import maintainers from '../../lib/maintainers.js';
import getKey from '../../utils/get-key.js';

const labelFragmentsByKey = [{ recovered: 'sembuh' }, { deaths: 'meninggal' }, { cases: 'positif covid-19' }];

const scraper = {
  country: 'iso1:ID',
  maintainers: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'Ministry of Health Republic of Indonesia',
      name: 'Ministry of Health Republic of Indonesia',
      url: 'https://www.kemkes.go.id/'
    }
  ],
  type: 'table',
  url: 'https://www.kemkes.go.id/',
  async scraper() {
    const data = {};
    const $ = await fetch.page(this.url);
    const $table = $('.covid-case-container table');
    assert.equal($table.length, 1, 'The table can not be found, the page may not have loaded correctly');

    const $trs = $table.find('tbody tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const key = getKey({ label: $tr.find('td:first-child').text(), labelFragmentsByKey });
      const value = $tr.find('td:last-child').text();
      data[key] = parse.number(value);
    });
    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
