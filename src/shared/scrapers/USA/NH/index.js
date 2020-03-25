import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';
import * as pdfUtils from '../../../lib/pdf.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'NH',
  country: 'USA',
  url: 'https://www.nh.gov/covid19/documents/case-map.pdf',
  aggregate: 'county',
  maintainers: [
    {
      name: 'Quentin Golsteyn',
      github: 'qgolsteyn'
    }
  ],
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
    }
  }
};

export default scraper;
