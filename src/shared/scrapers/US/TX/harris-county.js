import * as fetch from '../../../lib/fetch/index.js';
// import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';

// Construct xpath condition for containing a class
const classCheck = x => `contains(concat(' ',normalize-space(@class),' '),' ${x} ')`;

// Extract the text value of the puppeteer element
async function getTextcontent(el) {
  const out = await (await el.getProperty('textContent')).jsonValue();
  return out;
}

// Get cell values from part of a PowerBI pivot table.
// Use `parentClassName = 'columnHeaders'` to get column names,
//     `parentClassName = 'rowHeaders'` for row labels
//     `parentClassName = 'bodyCells'` for actual body of the table
async function _getTableVals(el, parentClassName) {
  const elements = await el.$x(`//div[@class='${parentClassName}']//div[${classCheck('pivotTableCellWrap')}]`);
  return Promise.all(elements.map(getTextcontent));
}

// Get the values from a PowerBI pivotTable, given the puppeteer elementHandle for the table div
const getDataFromPivotTable = async el => {
  // check that we have Date
  const indexName = await el.$x(`//div[@class='corner']//div[${classCheck('pivotTableCellWrap')}]`);
  if (indexName.length !== 1) {
    throw Error(`Found ${indexName.length} index names, expected 1`);
  }
  const indexNameVal = await getTextcontent(indexName[0]);
  console.log(indexNameVal);
  if (indexNameVal.trim() !== 'Date') {
    throw Error(`Expected index name to be Date, found ${indexNameVal}`);
  }

  // get column names
  return {
    colnames: await _getTableVals(el, 'columnHeaders'),
    dates: await _getTableVals(el, 'rowHeaders'),
    data: await _getTableVals(el, 'bodyCells')
  };
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
        // Wait for ICU button to load then navigate to that page
        (await page.waitForXPath("//span[text()='ICU Bed Usage']/..")).click();

        // Now wait for harris county selector to load
        (await page.waitForXPath("//div[@aria-label='Harris']")).click();

        /* PowerBI dynamicly swaps out rows so we
     can't get it all without some scrolling magic
  */
        // fill start date  back to beginning
        // const startDate = await page.waitForXPath("//div[@class='date-slicer']//input[contains(@aria-label, 'Start')]")
        // await startDate.click({clickCount: 3})
        // await page.keyboard.type("3/18/2020")
        // await page.waitFor(1000)
        // await startDate.press("Enter")

        // use context menu to open table version of chart
        await (await page.$$('div.visual-lineChart'))[0].click({ button: 'right' });
        const tableButton = await page.waitForXPath("//drop-down-list-item[//h6[text()='Show as a table']]", {
          visible: true
        });

        await page.waitFor(2000);
        await tableButton.click();

        console.log('I have a table button:', tableButton);

        // Get the data
        const data = await page.waitForXPath("//div[@aria-label='Grid']").then(getDataFromPivotTable);

        // return now as we don't need the browser anymore
        return data;
      };

      const data = await fetch.fetchHeadlessPage(this.url, callback);
      console.log(data);
    }
  }
};

export default scraper;
