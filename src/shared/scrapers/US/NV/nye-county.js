import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import datetime from '../../../lib/datetime/index.js';

const scraper = {
  county: 'fips:32023',
  country: 'iso1:US',
  state: 'iso2:US-NV',
  aggregate: 'county',
  timeseries: false,
  sources: [
    {
      name: 'Coronavirus (COVID-19) Information | Nye County, NV Official Website',
      url: 'https://www.nyecounty.net/',
      description:
        'The latest information gathered within and outside the county regarding the Coronavirus (COVID-19) preparation and any response by the County Department of Emergency Management and County Administration.'
    }
  ],
  _cities: ['Amargosa Valley', 'Beatty', 'Pahrump', 'Tonopah'],
  certValidation: false,
  url: 'https://www.nyecounty.net/1066/Coronavirus-COVID-19-Information',
  type: 'table',
  scraper: {
    '0': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
      const $ = await fetch.page(this, this.url, 'default');
      const table = $('table', '#page');
      assert.equal(table.length, 1, 'Table not found');

      const rows = table.find('tbody tr');

      const approximateTests = parse.number(
        table
          .find('caption')
          .text()
          .match(/[^\D]([,0-9]+)\./)[0]
      );
      // var lastUpdated = datetime.getYYYYMMDD($('h2').text().match(/((\w+)\s(\d{1,2})\,\s(\d{4}))/)[0])

      const countyData = {
        county: this.county,
        cases: 0,
        tested: typeof approximateTests === 'number' ? approximateTests : undefined,
        recovered: 0,
        date
      };

      // Collecting cities, but not returning them, in case we want to
      // use them in the future.
      const cities = [];
      $(rows).each(function(i, row) {
        const c = $(row).find('td');
        if (c.eq(0).text() === 'Deaths') {
          countyData.deaths = parse.number(c.eq(1).text());
        } else {
          const city = {
            date,
            city: parse.string(c.eq(0).text()),
            cases: parse.number(c.eq(1).text() || undefined),
            recovered: parse.number(c.eq(2).text() || undefined)
          };
          countyData.cases += city.cases;
          countyData.recovered += city.recovered;

          cities.push(city);
        }
      });
      // console.info(cities);
      // console.info(countyData);
      return [countyData];
    }
  }
};

export default scraper;
