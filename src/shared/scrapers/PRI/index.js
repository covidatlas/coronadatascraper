import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';

const scraper = {
  country: 'iso1:PR',
  type: 'table',
  timeseries: false,
  url: 'http://salud.gov.pr/Pages/coronavirus.aspx',
  sources: [
    {
      url: 'http://salud.gov.pr/',
      name: 'Gobierno de Puerto Rico Departamento de Salud'
    }
  ],
  maintainers: [
    {
      name: 'Jacob McGowan',
      github: 'jacobmcgowan'
    }
  ],
  async scraper() {
    const $ = await fetch.page(this.url);
    const $table = $('th:contains("CONFIRMADOS")').closest('table');
    if ($table.length === 0) {
      throw new Error('Table not found');
    }
    const $dataRow = $table.find('tbody > tr:nth-child(2)');

    return {
      tested: parse.number($dataRow.find('td:first-child h2').text()),
      cases: parse.number($dataRow.find('td:nth-child(2) h2').text()),
      deaths: parse.number($dataRow.find('td:nth-child(5) h2').text())
    };
  }
};

export default scraper;
