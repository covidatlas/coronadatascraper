import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MA',
  country: 'USA',
  aggregate: 'county',
  scraper: {
    '2020-03-13': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
      const dateObj = new Date(process.env.SCRAPE_DATE || datetime.getDate());

      if (date === '2020-03-19') {
        // They had a weird URL for this day
        this.url = 'https://www.mass.gov/doc/covid-19-cases-in-massachusetts-as-of-march-19-2020-x-updated4pm/download';
      } else {
        this.url = `https://www.mass.gov/doc/covid-19-cases-in-massachusetts-as-of-march-${dateObj.getDate() + 1}-2020/download`;
      }

      const rows = await fetch.pdf(this.url, date, { alwaysRun: true });

      const counties = [];

      const startIndex = rows.findIndex(str => str.includes('County')) + 1;

      for (let i = startIndex; !rows[i].includes('Unknown') && !rows[i].includes('Sex'); i++) {
        const data = rows[i].split(' ');
        const countyName = data[0];
        const cases = data[1];

        counties.push({
          county: geography.addCounty(countyName),
          cases: parse.number(cases)
        });
      }

      const summedData = transform.sumData(counties);

      // MA provides an unknown category, we sum it into the state total
      const unknownIndex = rows.findIndex(str => str.includes('Unknown'));
      if (unknownIndex > 0) summedData.cases += parse.number(rows[unknownIndex].split(' ')[1]);

      // MA has death as a total for the state
      const deathIndex = rows.findIndex(str => str.includes('Death')) + 1;
      if (deathIndex > 0) {
        const deathData = rows[deathIndex].split(' ');
        summedData.death = parse.number(deathData[deathData.length - 1]);
      }

      counties.push(summedData);

      return counties;
    }
  }
};

export default scraper;
