import * as fetch from '../../../lib/fetch/index.js';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';

const assert = require('assert');

// Get cell values from part of a PowerBI pivot table.
// Use `parentClassName = 'columnHeaders'` to get column names,
//     `parentClassName = 'rowHeaders'` for row labels
//     `parentClassName = 'bodyCells'` for actual body of the table
function _getTableVals($, parentClassName) {
  const elements = $(`div.${parentClassName} > div > div > div.pivotTableCellWrap`);
  return elements.toArray().map(a =>
    $(a)
      .text()
      .trim()
  );
}

function _getColumnData($, n) {
  const col = $('div.bodyCells > div > div > div').eq(n);
  const cells = $(col)
    .find('div.pivotTableCellWrap')
    .toArray();
  return cells.map(a => parseInt($(a).text(), 10));
}

// Get the values from a PowerBI pivotTable.
const getDataFromPivotTable = $ => {
  // check that we have Date
  const indexNameVal = $('div.corner > div > div.pivotTableCellWrap')
    .text()
    .trim();
  if (indexNameVal.trim() !== 'Date') {
    throw Error(`Expected index name to be Date, found ${indexNameVal}`);
  }

  const colnames = _getTableVals($, 'columnHeaders').slice(0, 2);
  const expectedColname = [
    'Patients in General Beds (Suspected + Confirmed)',
    'Patients in Intensive Care Beds (Suspected + Confirmed)'
  ];
  assert.equal(colnames.join(';'), expectedColname.join(';'), 'Column names');

  const dates = _getTableVals($, 'rowHeaders')
    .map(x => new Date(x))
    .map(datetime.parse)
    .map(x => x.toString());

  const ret = {
    colnames: _getTableVals($, 'columnHeaders'),
    dates,
    generalBeds: _getColumnData($, 0),
    icuBeds: _getColumnData($, 1)
  };

  assert.equal(ret.dates.length, ret.generalBeds.length, 'general beds');
  assert.equal(ret.dates.length, ret.icuBeds.length, 'icu beds');
  return ret;
};

const scraper = {
  county: 'fips:48201',
  state: 'iso2:US-TX',
  country: 'iso1:US',
  url:
    'https://app.powerbi.com/view?r=eyJrIjoiYjU5MzU4NjAtZWJjMC00MTllLTkwYjYtMzE4ODY1YjAyMGU2IiwidCI6ImI3MjgwODdjLTgwZTgtNGQzMS04YjZmLTdlMGUzYmUxMGUwOCIsImMiOjN9',
  sources: [
    {
      name: 'SouthEast Texas Regional Advisory Council',
      url: 'https://www.setrac.org/',
      description: 'SouthEast Texas Regional Advisory Council'
    }
  ],
  _counties: ['Harris County'],
  timeseries: true,
  aggregate: 'county',
  type: 'json',
  maintainers: [maintainers.sglyon],
  scraper: {
    '0': async function() {
      const callback = async page => {
        page.setDefaultTimeout(10000);
        const icuButton = await page.waitForXPath("//span[text()='Hospital/COVID Census']/..");
        icuButton.click();

        const harrisSelector = await page.waitForXPath("//div[@aria-label='Harris']");
        harrisSelector.click();

        // use context menu to open table version of chart
        await (await page.$$('div.visual-lineChart'))[0].click({ button: 'right' });
        const tableButton = await page.waitForXPath("//drop-down-list-item[//h6[text()='Show as a table']]", {
          visible: true
        });

        await page.waitFor(2000);
        await tableButton.click();

        await page.waitForXPath("//div[@aria-label='Grid']");
        return page.content();
      };

      // The data is timeseries but only for a limited timespan (a few
      // weeks), so we'll cache it like regular data.
      let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : new Date();

      const rawdata = await fetch.headless(this, this.url, 'default', scrapeDate, { callback });

      const data = getDataFromPivotTable(rawdata);

      const outData = {};
      for (let ix = 0; ix < data.dates.length; ix++) {
        outData[data.dates[ix]] = {
          hospitalized_current: data.generalBeds[ix],
          icu_current: data.icuBeds[ix]
        };
      }
      // console.table(outData);

      const lastDateInTimeseries = new Date(`${data.dates[data.dates.length - 1]} 12:00:00`);
      const firstDateInTimeseries = new Date(`${data.dates[0]} 12:00:00`);

      if (scrapeDate > lastDateInTimeseries) {
        console.error(
          `  🚨 timeseries for Harris County (TX): SCRAPE_DATE ${datetime.getYYYYMD(
            scrapeDate
          )} is newer than last sample time ${datetime.getYYYYMD(lastDateInTimeseries)}. Using last sample anyway`
        );
        scrapeDate = lastDateInTimeseries;
      }

      if (scrapeDate < firstDateInTimeseries) {
        throw new Error(
          `Timeseries starts at ${datetime.getYYYYMD(firstDateInTimeseries)}, but SCRAPE_DATE is ${datetime.getYYYYMD(
            scrapeDate
          )}`
        );
      }

      const scrapeDateString = datetime.parse(scrapeDate).toString();
      return outData[scrapeDateString];
    }
  }
};

export default scraper;
