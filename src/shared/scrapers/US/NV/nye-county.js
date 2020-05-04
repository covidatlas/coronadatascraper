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

      const counties = [
        {
          county: this.county,
          cases: 0,
          tested: typeof approximateTests === 'number' ? approximateTests : undefined,
          deaths: 0,
          recovered: 0,
          date
        }
      ];

      const cities = [];

      $(rows).each(function(i, row) {
        if (
          $('td', row)
            .eq(0)
            .text() === 'Deaths'
        ) {
          counties[0].deaths =
            typeof $('td', row)
              .eq(2)
              .text() === 'number'
              ? parse.number(
                  typeof $('td', row)
                    .eq(2)
                    .text()
                )
              : undefined;
        } else {
          const city = {
            city: parse.string(
              $('td', row)
                .eq(0)
                .text()
            ),
            cases: parse.number(
              $('td', row)
                .eq(2)
                .text() || 0
            ),
            recovered: parse.number(
              $('td', row)
                .eq(3)
                .text() || 0
            )
          };
          counties[0].cases += city.cases;
          counties[0].recovered += city.recovered;

          cities.push(city);
        }
      });

      return counties;
    }
  }
};

export default scraper;
