import assert from 'assert';
import cheerio from 'cheerio';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import datetime from '../../../lib/datetime/index.js';
import { DeprecatedError } from '../../../lib/errors.js';

const scraper = {
  state: 'iso2:US-NV',
  country: 'iso1:US',
  aggregate: 'county',
  url: 'https://gethealthycarsoncity.org/novel-coronavirus-2019/',
  sources: [
    {
      name: 'Carson City Health and Human Services',
      url: 'https://gethealthycarsoncity.org/',
      description:
        'Carson City Health and Human Services - Aggregate data for the Quad County region: Carson City, Douglas, Lyon, and Storey counties.'
    }
  ],
  _counties: ['Carson City', 'Douglas County', 'Lyon County', 'Storey County'],
  certValidation: false,
  type: 'table',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('table');
      assert.equal($table.length, 1, 'Table not found');
      const $trs = $table.find('tbody > tr:not(:first-child)');

      const counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const name = parse.string($tr.find('td:first-child').text());
        if (name === 'TOTAL') {
          return;
        }
        counties.push({
          county: name,
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          active: parse.number($tr.find('td:nth-child(3)').text()),
          recovered: parse.number($tr.find('td:nth-child(4)').text()),
          deaths: parse.number($tr.find('td:last-child').text())
        });
      });

      return counties;
    },
    '2020-04-19': async function() {
      throw new DeprecatedError(
        'County-level data has moved to a bunch of DIVs at https://gethealthycarsoncity.org/novel-coronavirus-2019/covid-19-by-county/'
      );
    },
    '2020-04-20': async function() {
      this.url = 'https://gethealthycarsoncity.org/novel-coronavirus-2019/covid-19-by-county/';
      this.title = 'Covid-19 by County | Get Healthy Carson City';

      // var countyUpdated = new Date(cheerio('.updated.rich-snippet-hidden').text());

      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
      const $ = await fetch.headless(this, this.url, 'default', date, { disableSSL: true });
      const div = $('.post-content');
      assert.equal(div.length, 1, 'Table not found');
      const records = div.find('.fusion-fullwidth:not(:first-child)');

      const counties = [];
      $(records).each((index, record) => {
        const $record = cheerio.load(record);
        const name = parse.string($record('.title').text());
        if (name === 'TOTAL') {
          return;
        }
        const displayCounterValue = index => {
          return parse.number(
            $record('.display-counter')
              .eq(index)
              .data('value')
          );
        };
        counties.push({
          county: name,
          cases: displayCounterValue(0),
          active: displayCounterValue(1),
          recovered: displayCounterValue(2),
          deaths: displayCounterValue(3)
        });
      });

      console.log(counties);
      return counties;
    }
  }
};

export default scraper;
