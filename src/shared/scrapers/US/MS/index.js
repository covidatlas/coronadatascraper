import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

const assert = require('assert');

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-MS',
  country: 'iso1:US',
  sources: [
    {
      url: 'https://msdh.ms.gov/',
      name: 'Mississippi State Department of Health'
    }
  ],
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
  // The publisher is making typos in their html table!
  _fixCountyTypos(county) {
    let fixed = county;
    if (county === 'De Soto County' || county === 'Desoto County') {
      fixed = 'DeSoto County';
    }
    if (county === 'Leeflore County') {
      fixed = 'Leflore County';
    }
    return fixed;
  },
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
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
    '2020-03-15': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('h4:contains("All Mississippi cases to date")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr:not(:last-child)');
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
    },
    '2020-03-20': async function() {
      const $ = await fetch.page(this, this.url, 'default');

      // Pick the last one, because older pages had a table of "new cases"
      // before the table of "total cases"
      const $td = $('td:contains("County")').last();

      const headers = [];
      headers.push($td.text());
      headers.push($td.next().text());
      headers.push(
        $td
          .next()
          .next()
          .text()
      );
      const expectedHeaders = ['County', 'Cases', 'Deaths'];
      assert.equal(headers.join(','), expectedHeaders.join(','), 'expected table headers');

      const $table = $td.closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      let counties = [];
      $trs.each((index, tr) => {
        const $tr = $(tr);
        if ($tr.children().length === 0) {
          // Skip blank TRs
          return;
        }

        let county = geography.addCounty(parse.string($tr.find('td:first-child').text()));
        county = this._fixCountyTypos(county);

        counties.push({
          county,
          cases: parse.number(parse.string($tr.find('td:nth-child(2)').text()) || 0),
          deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
        });
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-04-17': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('#msdhTotalCovid-19Cases');

      // Validate the headings we care about.
      const $ths = $table.find('thead > tr > td');
      const headers = $ths
        .toArray()
        .slice(0, 3)
        .map(th => $(th).text());
      const expectedHeaders = ['County', 'Total Cases', 'Total Deaths'];
      assert.equal(headers.join(','), expectedHeaders.join(','), 'expected table headers');

      const getCellTextArray = tr => {
        return $(tr)
          .find('td')
          .toArray()
          .map(c =>
            $(c)
              .text()
              .trim()
          )
          .map(c => (c === '' ? '0' : c));
      };
      const getReportData = row => {
        let county = geography.addCounty(parse.string(row[0]));
        county = this._fixCountyTypos(county);
        return { county, cases: parse.number(row[1]), deaths: parse.number(row[2]) };
      };

      const $trs = $table.find('tbody > tr:not(:last-child)');
      const counties = $trs
        .toArray()
        .map(getCellTextArray)
        .map(getReportData);

      const result = geography.addEmptyRegions(counties, this._counties, 'county');
      result.push(transform.sumData(counties));
      return result;
    }
  }
};

export default scraper;
