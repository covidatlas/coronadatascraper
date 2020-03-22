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
  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    const $table = $('*:contains("Novel Coronavirus in Hawaii")').closest('table');
    const $trs = $table.find('tr');

    let stateDeaths = 0;
    let rowCellValueList;

    $trs.each((index, tr) => {
      const $tr = $(tr);

      /* 
          TODO: This range will need to be expanded out when/if a case is found in Kalawao.
          At time of writing, this county has no cases and is not shown in the data table.
          Very likely to change. Additionally, index for state deaths will also need to be modified
          when/if final county is added to table (deaths are only listed for the state and not per county row).
        */
      if (index > 2 && index < 7) {
        // This is to exclude extraneous empty rows in table html.

        rowCellValueList = $tr.text().split('\n');

        const county = rowCellValueList[1].trim();
        const cases = rowCellValueList[2].substr(0, rowCellValueList[2].indexOf(' ')).trim();

        counties.push({
          name: geography.addCounty(county),
          cases: parse.number(cases)
        });
      }

      if (index === 9) {
        rowCellValueList = $tr.text().split('\n');

        stateDeaths = rowCellValueList[2].substr(0, rowCellValueList[2].indexOf(' ')).trim();
      }
    });

    const aggregationRecord = transform.sumData(counties);

    // Adding extracted death count.
    aggregationRecord.deaths = parse.number(stateDeaths);

    counties.push(aggregationRecord);

    return counties;
  }
};

export default scraper;
