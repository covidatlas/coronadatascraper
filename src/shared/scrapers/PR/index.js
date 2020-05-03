import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import getSchemaKeyFromHeading from '../../utils/get-schema-key-from-heading.js';
import maintainers from '../../lib/maintainers.js';
import normalizeTable from '../../utils/normalize-table.js';

const schemaKeysByHeadingFragment = {
  'muertes​': 'deaths',
  prueba: 'tested',
  realizadas: 'tested',
  '​casos postivos': 'cases',
  confirmados: 'cases',
  'en proceso': null,
  negativos: null
};

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
    const normalizedTable = normalizeTable({ $, tableSelector: 'table:contains("MUERTES")' });
    const headingRowIndex = 0;
    const dataKeysByColumnIndex = [];
    normalizedTable[headingRowIndex].forEach((heading, index) => {
      dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
    });

    const dataRow = normalizedTable[normalizedTable.length - 1];

    const data = {};
    dataRow.forEach((value, columnIndex) => {
      const key = dataKeysByColumnIndex[columnIndex];
      if (key) {
        data[key] = parse.number(value);
      }
    });

    assert(data.cases > 0, 'Cases is not reasonable');
    return data;
  }
};

export default scraper;
