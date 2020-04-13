import cheerioTableparser from 'cheerio-tableparser';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as pdfUtils from '../../../lib/pdf.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'NH',
  country: 'iso1:US',
  sources: [
    {
      name: 'New Hampshire Department of Health and Human Services',
      url: 'https://www.nh.gov/covid19/'
    }
  ],
  url: 'https://www.nh.gov/covid19/documents/case-map.pdf',
  aggregate: 'county',
  maintainers: [maintainers.qgolsteyn],
  type: 'pdf',
  _counties: [
    'Coos',
    'Grafton',
    'Carroll',
    'Belknap',
    'Merrimack',
    'Sullivan',
    'Cheshire',
    'Hillsborough',
    'Rockingham',
    'Strafford'
  ],
  scraper: {
    '0': async function() {
      const body = await fetch.pdf(this.url);
      const rows = pdfUtils.asWords(body, 0, 1000).map(row => row[0]);

      const counties = [];
      for (const county of this._counties) {
        const countyItem = rows.find(row => row.text === county);

        let cases = parse.number(
          pdfUtils
            .getNearest(countyItem, rows) // Sort items by nearest in PDF
            .find(item => !Number.isNaN(parse.number(item))) // Include first that is not a number
        );

        if (county === 'Hillsborough') {
          // We need to include cases for cities within this county that are counted separately
          cases += parse.number(
            pdfUtils.getNearest(
              rows.find(row => row.text === 'Manchester'),
              rows
            )[1]
          );

          cases += parse.number(
            pdfUtils.getNearest(
              rows.find(row => row.text === 'Nashua'),
              rows
            )[2]
          );
        }

        counties.push({
          county: geography.addCounty(county),
          cases: parse.number(cases)
        });
      }

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-31': async function() {
      await fetch.pdf(this.url);
      throw new DeprecatedError('New Hampshire stopped reporting county-level data as of 2020/3/31');
    },
    '2020-4-12': async function() {
      this.url = 'https://www.nh.gov/covid19/';
      this.type = 'table';

      const $ = await fetch.page(this.url);
      cheerioTableparser($);

      const $countyTable = $('.county-table');
      const data = $countyTable.parsetable(true, true, true);

      const counties = [];
      const Hillsborough = {
        county: 'Hillsborough County',
        cases: 0
      };

      data[0].forEach((name, i) => {
        if (name.includes('Hillsborough')) {
          Hillsborough.cases += parse.number(data[1][i]);
        } else if (!name.match(/County$|Total/)) {
          counties.push({
            county: name.includes('TBD') ? UNASSIGNED : geography.addCounty(name),
            cases: parse.number(data[1][i])
          });
        }
      });

      counties.push(Hillsborough);

      const $summaryTable = $('.summary-list');
      const summary = $summaryTable.parsetable(true, true, true);

      const getTableNumber = text => {
        return summary[1][summary[0].findIndex(str => str.includes(text))].match(/[\d,]+/)[0];
      };

      const casesTotal = parse.number(summary[1][summary[0].indexOf('Number of Persons with COVID-191')]);
      const deathsTotal = parse.number(getTableNumber('Deaths'));
      const recoveredTotals = parse.number(getTableNumber('Recovered'));
      const testedTotals = parse.number(getTableNumber('Tested Negative'));

      const totals = {
        cases: casesTotal,
        deaths: deathsTotal,
        recovered: recoveredTotals,
        tested: testedTotals
      };

      counties.push(totals);
      return counties;
    }
  }
};

export default scraper;
