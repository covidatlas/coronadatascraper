import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Joaquin County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'http://www.sjcphs.org/coronavirus.aspx#res',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      this.type = 'paragraph';
      const h3 = $('h6:contains("confirmed cases of COVID-19")')
        .first()
        .text();
      const cases = parse.number(h3.match(/\((\d+)\)/)[1]);
      return { cases };
    },
    '2020-03-17': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      this.type = 'table';
      const $table = $('h3:contains("San Joaquin County COVID-19 Numbers at a Glance")').closest('table');
      const $headers = $table.find('tbody > tr:nth-child(2) > td');
      const $numbers = $table.find('tbody > tr:nth-child(3) > td');
      let cases = 0;
      let deaths = 0;
      $headers.each((index, td) => {
        const $td = $(td);
        if ($td.text().includes('Cases')) {
          cases = parse.number($numbers.eq(index).text());
        }
        if ($td.text().includes('Deaths')) {
          deaths = parse.number($numbers.eq(index).text());
        }
      });
      return {
        cases,
        deaths
      };
    }
  }
};

export default scraper;
