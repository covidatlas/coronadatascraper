import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

// region definitions are found on https://en.wikipedia.org/wiki/NHS_Scotland

const countryLevelMap = {
  'Ayrshire and Arran': 'iso2:GB-NAY+iso2:GB-EAY+iso2:GB-SAY',
  Borders: 'iso2:GB-SCB',
  'Dumfries and Galloway': 'iso2:GB-DGY',
  Fife: 'iso2:GB-FIF',
  'Forth Valley': 'iso2:GB-CLK+iso2:GB-FAL+iso2:GB-STG',
  Grampian: 'iso2:GB-ABD+iso2:GB-ABE+iso2:GB-MRY',
  'Greater Glasgow and Clyde': 'iso2:GB-GLG+iso2:GB-EDU+iso2:GB-ERW+iso2:GB-IVC+iso2:GB-RFW+iso2:GB-WDU',
  Highland: 'iso2:GB-HLD+iso2:GB-AGB',
  Lanarkshire: 'iso2:GB-NLK+iso2:GB-SLK',
  Lothian: 'iso2:GB-EDH+iso2:GB-ELN+iso2:GB-MLN+iso2:GB-WLN',
  Orkney: 'iso2:GB-ORK',
  Shetland: 'iso2:GB-ZET',
  Tayside: 'iso2:GB-ANS+iso2:GB-DND+iso2:GB-PKN',
  'Eileanan Siar (Western Isles)': 'iso2:GB-ELS'
};

const scraper = {
  country: 'iso1:GB',
  state: 'iso2:GB-SCT',
  url: 'https://www.gov.scot/coronavirus-covid-19/',
  aggregate: 'county',
  type: 'table',
  scraper: {
    '0': async function() {
      function findText(node) {
        const immediateChild = node.children[0];
        const isText = immediateChild.type === 'text';
        return isText ? immediateChild.data : findText(immediateChild);
      }

      const counties = [];
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('tbody').first();
      $table.children('tr').each((i, item) => {
        const columns = $(item).children('td');
        const county = findText(columns[0]);
        const confirmedCases = findText(columns[1]);

        const clId = countryLevelMap[county];
        if (!clId) {
          console.error(`GB, SCT: ${county} not found in countryLevelMap`);
          return;
        }

        counties.push({
          county: clId,
          cases: parse.number(confirmedCases)
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-03-29': async function() {
      const counties = [];
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('td:contains("Positive cases")').closest('table');
      $table.find('tr:not(:first-child)').each((i, tr) => {
        const $tr = $(tr);
        const county = parse.string($tr.find('td:first-child').text());
        const clId = countryLevelMap[county];

        if (!clId) {
          console.error(`GB, SCT: ${county} not found in countryLevelMap`);
          return;
        }

        counties.push({
          county: clId,
          cases: parse.number($tr.find('td:last-child').text())
        });
      });

      counties.push(transform.sumData(counties));

      return counties;
    }
  }
};

export default scraper;
