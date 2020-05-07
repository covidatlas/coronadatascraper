import assert from 'assert';
import * as fetch from '../../../../lib/fetch/index.js';
import * as parse from '../../../../lib/parse.js';
import getSchemaKeyFromHeading from '../../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../../lib/maintainers.js';

const schemaKeysByHeadingFragment = { deaths: 'deaths', recovered: 'recovered', 'total cases': 'cases' };

const scraper = {
  county: 'Kings County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina, maintainers.camjc],
  url:
    'https://www.countyofkings.com/departments/health-welfare/public-health/coronavirus-disease-2019-covid-19/-fsiteid-1',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const cases = parse.number(
        $('h3:contains("Confirmed Cases")')
          .text()
          .match(/Confirmed Cases: (\d+)/)[1]
      );
      return { cases };
    },
    '2020-04-13': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $rows = $('ul:contains("Total Cases") > li');
      const data = {};
      $rows.each((index, row) => {
        const $row = $(row);
        const [heading, value] = $row
          .text()
          .split('\n')[0]
          .split(': ');
        const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
        if (key) {
          data[key] = parse.number(value);
        }
      });

      assert(data.cases > 0, 'Cases is not reasonable');
      return data;
    }
  }
};

export default scraper;
