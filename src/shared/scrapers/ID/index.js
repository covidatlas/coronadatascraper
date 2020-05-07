import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import maintainers from '../../lib/maintainers.js';
import getSchemaKeyFromHeading from '../../utils/get-schema-key-from-heading.js';

const schemaKeysByHeadingFragment = {
  sembuh: 'recovered',
  meninggal: 'deaths',
  'jumlah pdp': null, // pasien dalam pengawasan: "People in monitoring"
  'jumlah odp': null, // orang dalam pemantauan: "Patients under supervision"
  'positif covid-19': 'cases'
};

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
    const $ = await fetch.page(this, this.url, 'default');
    const $table = $('.covid-case-container table');
    assert.equal($table.length, 1, 'The table can not be found, the page may not have loaded correctly');

    const $trs = $table.find('tbody tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const key = getSchemaKeyFromHeading({
        heading: $tr
          .find('td:first-child')
          .text()
          .replace('(Positif COVID-19)', ''),
        schemaKeysByHeadingFragment
      });
      const value = $tr.find('td:last-child').text();
      if (key) {
        data[key] = parse.number(value.replace('.', '')); // This thousands-separator replace may be better handled in the number parser.
      }
    });
    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
