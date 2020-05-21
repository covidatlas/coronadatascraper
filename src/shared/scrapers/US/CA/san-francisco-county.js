import * as fetch from '../../../lib/fetch/index.js';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Francisco County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers['1ec5']],
  type: 'json',
  timeseries: true,
  headless: false,
  sources: [
    {
      name: 'San Francisco Department of Public Health',
      url: 'https://data.sfgov.org/COVID-19/COVID-19-Cases-Summarized-by-Date-Transmission-and/tvq9-ec9w',
      description: 'COVID-19 Cases Summarized by Date, Transmission and Case Disposition'
    },
    {
      name: 'San Francisco Department of Public Health',
      url: 'https://data.sfgov.org/COVID-19/COVID-19-Hospitalizations/nxjg-bhem',
      description: 'COVID-19 Hospitalizations'
    },
    {
      name: 'San Francisco Department of Public Health',
      url: 'https://data.sfgov.org/COVID-19/COVID-19-Tests/nfpa-mg4g',
      description: 'COVID-19 Tests'
    }
  ],
  url: 'https://data.sfgov.org/stories/s/dak2-gvuj',
  _urls: {
    cases: 'https://data.sfgov.org/resource/tvq9-ec9w.json',
    patients: 'https://data.sfgov.org/resource/nxjg-bhem.json',
    tests: 'https://data.sfgov.org/resource/nfpa-mg4g.json'
  },
  scraper: {
    '0': async function() {
      const cases = await fetch.json(this, this._urls.cases, 'cases', false);
      const patients = await fetch.json(this, this._urls.patients, 'patients', false);
      const tests = await fetch.json(this, this._urls.tests, 'tests', false);
      const timeSeries = {};
      cases.reduceRight(
        (acc, cur) => {
          const date = datetime.getYYYYMMDD(cur.date);
          const field = cur.case_disposition === 'Death' ? 'deaths' : 'cases';
          acc[field] += +cur.case_count;
          if (!(date in timeSeries)) {
            timeSeries[date] = {};
          }
          timeSeries[date][field] = acc[field];
          return acc;
        },
        {
          cases: 0,
          deaths: 0
        }
      );
      patients.forEach(elt => {
        const date = datetime.getYYYYMMDD(elt.reportdate);
        if (!(date in timeSeries)) {
          timeSeries[date] = {};
        }
        if (elt.patientcount) {
          if (!('hospitalized' in timeSeries[date])) {
            timeSeries[date].hospitalized = 0;
          }
          timeSeries[date].hospitalized += +elt.patientcount;
        }
      });
      tests.reduceRight((acc, cur) => {
        const date = datetime.getYYYYMMDD(cur.result_date);
        acc += +cur.tests;
        if (!(date in timeSeries)) {
          timeSeries[date] = {};
        }
        timeSeries[date].tested = acc;
        return acc;
      }, 0);

      let scrapeDate = datetime.scrapeDate() || new Date();
      let scrapeDateString = datetime.getYYYYMMDD(new Date(scrapeDate));
      const datesInTimeseries = Object.keys(timeSeries).sort();
      const lastDateInTimeseries = new Date(datesInTimeseries.slice(-1)[0]);
      const firstDateInTimeseries = new Date(datesInTimeseries[0]);

      if (datetime.scrapeDateIsAfter(lastDateInTimeseries)) {
        console.error(
          `  🚨 timeseries for San Francisco County: SCRAPE_DATE ${datetime.getYYYYMMDD(
            scrapeDate
          )} is newer than last sample time ${datetime.getYYYYMMDD(lastDateInTimeseries)}. Using last sample anyway`
        );
        scrapeDate = lastDateInTimeseries;
        scrapeDateString = datetime.getYYYYMMDD(scrapeDate);
      }

      if (datetime.scrapeDateIsBefore(firstDateInTimeseries)) {
        throw new Error(`Timeseries starts later than SCRAPE_DATE ${datetime.getYYYYMMDD(scrapeDate)}`);
      }

      return timeSeries[scrapeDateString];
    }
  }
};

export default scraper;
