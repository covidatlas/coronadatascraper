import * as fetch from '../../../lib/fetch.js';
import * as geography from '../../../lib/geography.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

const scraper = {
  country: 'USA',
  state: 'HI',
  priority: 1,
  url: 'https://health.hawaii.gov/docd/advisories/novel-coronavirus-2019/',
  source: {
    name: 'Hawaii Department of Health - Disease Outbreak Control Division',
    url: 'https://health.hawaii.gov/docd/advisories/novel-coronavirus-2019/'
  },
  maintainers: [
    {
      name: 'Jordan Holt',
      email: 'jordholt@gmail.com',
      github: 'Jord-Holt',
      country: 'USA',
      flag: '🇺🇸'
    }
  ],
  aggregate: 'county',
  _counties: ['Hawaii County', 'Honolulu County', 'Kauai County', 'Maui County', 'Kalawao County'],
  async scraper() {
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
  }
};

export default scraper;
