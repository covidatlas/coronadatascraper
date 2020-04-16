import * as fetch from '../../../lib/fetch/index.js';
import * as geography from '../../../lib/geography/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

const scraper = {
  country: 'iso1:US',
  state: 'iso2:US-HI',
  priority: 1,
  sources: [
    {
      name: 'Hawaii Department of Health - Disease Outbreak Control Division',
      url: 'https://health.hawaii.gov/docd/advisories/novel-coronavirus-2019/'
    }
  ],
  maintainers: [
    {
      name: 'Jordan Holt',
      email: 'jordholt@gmail.com',
      github: 'Jord-Holt',
      country: 'iso1:US',
      flag: '🇺🇸'
    }
  ],
  aggregate: 'county',
  _counties: ['Hawaii County', 'Honolulu County', 'Kauai County', 'Maui County', 'Kalawao County'],
  scraper: {
    '0': async function() {
      this.url = 'https://health.hawaii.gov/docd/advisories/novel-coronavirus-2019/';
      this.type = 'table';
      let counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('*:contains("Novel Coronavirus in Hawaii")').closest('table');
      const $trs = $table.find('tr');

      let stateDeaths = 0;
      let rowCellValueList;

      // Build county data array.

      $trs.each((index, tr) => {
        const $tr = $(tr);

        rowCellValueList = $tr.text().split('\n');

        let county = rowCellValueList[1].trim();
        const cases = rowCellValueList[2].substr(0, rowCellValueList[2].indexOf(' ')).trim();

        if (county === 'Deaths') {
          stateDeaths = rowCellValueList[2].substr(0, rowCellValueList[2].indexOf(' ')).trim();

          return;
        }

        county = geography.addCounty(county);

        if (this._counties.includes(geography.addCounty(county))) {
          counties.push({
            county: geography.addCounty(county),
            cases: parse.number(cases)
          });
        }
      });

      // Post process data array, add empty regions, total deaths and total cases aggregation record.

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      const aggregationRecord = transform.sumData(counties);

      // Adding extracted death count.
      aggregationRecord.deaths = parse.number(stateDeaths);

      counties.push(aggregationRecord);

      return counties;
    },
    '2020-03-26': async function() {
      this.url = 'https://health.hawaii.gov/coronavirusdisease2019/';
      this.type = 'list';
      let counties = [];

      const $ = await fetch.page(this.url);
      const $list = $('dd:contains("Honolulu County")')
        .parent()
        .find('dd');
      $list.each((index, row) => {
        const text = $(row).text();
        if (!text.includes('County')) {
          return;
        }
        const pieces = text.split(' ');
        const county = geography.addCounty(pieces[0].split('’').join(''));
        const cases = parse.number(pieces[2]);

        // console.log(county, cases);
        counties.push({
          county,
          cases
        });
      });

      counties.push(transform.sumData(counties));
      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      // console.log(counties);
      return counties;
    }
  }
};

export default scraper;
