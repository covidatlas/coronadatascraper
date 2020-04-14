import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import maintainers from '../../lib/maintainers.js';
import getKey from '../../utils/get-key.js';

const labelFragmentsByKey = [{ deaths: 'deaths' }, { discard: 'new case' }, { cases: 'total' }];

const scraper = {
  country: 'iso1:TH',
  maintainers: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'Department of Disease Control Thailand',
      name: 'Department of Disease Control Thailand',
      url: 'https://ddc.moph.go.th/'
    }
  ],
  type: 'table',
  url: 'https://ddc.moph.go.th/viralpneumonia/eng/index.php',
  async scraper() {
    const data = {};
    const $ = await fetch.page(this.url);
    const tableWrapper = $('#covic_popup .popup_blog')[0];
    const $table = $(tableWrapper).find('table');
    assert.equal($table.length, 1, 'Table can not be found');

    const $tds = $table.find('tbody tr:nth-child(3) td');
    assert.equal($tds.length, 3, 'Row should have 3 items');

    $tds.each((_index, td) => {
      const { label, value } = $(td)
        .text()
        .match(/(?<label>[A-Za-z ]+)(?<value>[\d,]+)/).groups;
      assert(label.length > 0, `Label incorrectly parsed: ${label}`);
      assert(value.length > 0, `Value incorrectly parsed: ${value}`);

      const key = getKey({ label, labelFragmentsByKey });
      data[key] = parse.number(value);
    });

    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
