import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';
import * as datetime from '../../../lib/datetime.js';
import * as pdfUtils from '../../../lib/pdf.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MA',
  country: 'USA',
  aggregate: 'county',
  type: 'pdf',
  maintainers: [
    {
      name: 'Quentin Golsteyn',
      github: 'qgolsteyn'
    }
  ],
  _counties: [
    'Barnstable County',
    'Berkshire County',
    'Bristol County',
    'Dukes County',
    'Essex County',
    'Franklin County',
    'Hampden County',
    'Hampshire County',
    'Middlesex County',
    'Nantucket County',
    'Norfolk County',
    'Plymouth County',
    'Suffolk County',
    'Worcester County'
  ],
  scraper: {
    '2020-03-13': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();

      if (date === '2020-03-19') {
        // They had a weird URL for this day
        this.url = 'https://www.mass.gov/doc/covid-19-cases-in-massachusetts-as-of-march-19-2020-x-updated4pm/download';
      } else {
        this.url = `https://www.mass.gov/doc/covid-19-cases-in-massachusetts-as-of-march-${new Date(
          date
        ).getUTCDate()}-2020/download`;
      }

      const body = await fetch.pdf(this.url);

      if (body === null) {
        throw new Error(`No data for ${date}`);
      }

      const rows = pdfUtils.asRows(body).map(row => row.map(col => col.text));

      const counties = [];

      const startIndex = rows.findIndex(cols => cols[0] && cols[0].includes('County')) + 1;

      for (let i = startIndex; !rows[i][0].includes('Unknown') && !rows[i][0].includes('Sex'); i++) {
        const data = rows[i];
        const countyName = data[0];
        const cases = data[1];

        counties.push({
          county: geography.addCounty(countyName),
          cases: parse.number(cases)
        });
      }

      const summedData = transform.sumData(counties);

      // MA provides an unknown category, we sum it into the state total
      const unknownIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Unknown'));
      if (unknownIndex > 0) summedData.cases += parse.number(rows[unknownIndex][1]);

      // MA has death as a total for the state
      const deathIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Death')) + 1;
      if (deathIndex > 0) {
        const deathData = rows[deathIndex];
        summedData.deaths = parse.number(deathData[deathData.length - 1]);
      }

      counties.push(summedData);

      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
