import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MS',
  country: 'USA',
  url: 'https://msdh.ms.gov/msdhsite/_static/14,0,420.html',
  type: 'table',
  aggregate: 'county',
  _counties: [
    'Adams County',
    'Alcorn County',
    'Amite County',
    'Attala County',
    'Benton County',
    'Bolivar County',
    'Calhoun County',
    'Carroll County',
    'Chickasaw County',
    'Choctaw County',
    'Claiborne County',
    'Clarke County',
    'Clay County',
    'Coahoma County',
    'Copiah County',
    'Covington County',
    'DeSoto County',
    'Forrest County',
    'Franklin County',
    'George County',
    'Greene County',
    'Grenada County',
    'Hancock County',
    'Harrison County',
    'Hinds County',
    'Holmes County',
    'Humphreys County',
    'Issaquena County',
    'Itawamba County',
    'Jackson County',
    'Jasper County',
    'Jefferson County',
    'Jefferson Davis County',
    'Jones County',
    'Kemper County',
    'Lafayette County',
    'Lamar County',
    'Lauderdale County',
    'Lawrence County',
    'Leake County',
    'Lee County',
    'Leflore County',
    'Lincoln County',
    'Lowndes County',
    'Madison County',
    'Marion County',
    'Marshall County',
    'Monroe County',
    'Montgomery County',
    'Neshoba County',
    'Newton County',
    'Noxubee County',
    'Oktibbeha County',
    'Panola County',
    'Pearl River County',
    'Perry County',
    'Pike County',
    'Pontotoc County',
    'Prentiss County',
    'Quitman County',
    'Rankin County',
    'Scott County',
    'Sharkey County',
    'Simpson County',
    'Smith County',
    'Stone County',
    'Sunflower County',
    'Tallahatchie County',
    'Tate County',
    'Tippah County',
    'Tishomingo County',
    'Tunica County',
    'Union County',
    'Walthall County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Webster County',
    'Wilkinson County',
    'Winston County',
    'Yalobusha County',
    'Yazoo County'
  ],
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('h3:contains("Mississippi Cases")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr');
      const countiesMap = {};
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const status = $tr.find('td:nth-child(3)').text();
        const county = geography.addCounty(parse.string($tr.find('td:nth-child(2)').text()));
        if (status === 'Confirmed' || status === 'Presumptive') {
          countiesMap[county] = countiesMap[county] || { cases: 0 };
          countiesMap[county].cases++;
        }
      });
      let counties = transform.objectToArray(countiesMap);

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-15': async function() {
      const $ = await fetch.page(this.url);
      const $table = $('h4:contains("All Mississippi cases to date")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const county = geography.addCounty(parse.string($tr.find('td:first-child').text()));
        counties.push({
          county,
          cases: parse.number($tr.find('td:last-child').text())
        });
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    }
  }
};

export default scraper;
