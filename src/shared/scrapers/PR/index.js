import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import getKey from '../../utils/get-key.js';
import maintainers from '../../lib/maintainers.js';
import pivotTheTable from '../../utils/pivot-the-table.js';

const labelFragmentsByKey = [
  { deaths: 'muertes​' },
  { tested: 'realizadas' },
  { cases: 'confirmados' },
  { discard: 'en proceso' },
  { discard: 'negativos' }
];

const scraper = {
  country: 'iso1:PR',
  type: 'table',
  timeseries: false,
  url: 'http://www.salud.gov.pr/Pages/coronavirus.aspx',
  sources: [
    {
      url: 'http://www.salud.gov.pr/',
      name: 'Gobierno de Puerto Rico Departamento de Salud'
    }
  ],
  maintainers: [
    {
      name: 'Jacob McGowan',
      github: 'jacobmcgowan'
    },
    maintainers.camjc
  ],
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    const $table = $('th:contains("CONFIRMADOS")').closest('table');
    const $trs = $table.find('tbody > tr');
    const dataPairs = pivotTheTable($trs, $);

    const data = {};
    dataPairs.forEach(([label, value]) => {
      const key = getKey({ label, labelFragmentsByKey });
      data[key] = parse.number(value);
    });

    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
