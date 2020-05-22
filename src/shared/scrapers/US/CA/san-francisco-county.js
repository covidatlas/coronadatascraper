import * as fetch from '../../../lib/fetch/index.js';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';
import * as parse from '../../../lib/parse.js';

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
  _getScrapeDateBounds: (proposed, allDates) => {
    let scrapeDate = proposed;
    const firstDateInTimeseries = new Date(allDates[0]);
    const lastDateInTimeseries = new Date(allDates.slice(-1)[0]);

    if (datetime.scrapeDateIsAfter(lastDateInTimeseries)) {
      console.error(
        `  🚨 timeseries for San Francisco County: SCRAPE_DATE ${datetime.getYYYYMMDD(
          scrapeDate
        )} is newer than last sample time ${datetime.getYYYYMMDD(lastDateInTimeseries)}. Using last sample anyway`
      );
      scrapeDate = lastDateInTimeseries;
    }

    if (datetime.scrapeDateIsBefore(firstDateInTimeseries)) {
      throw new Error(`Timeseries starts later than SCRAPE_DATE ${datetime.getYYYYMMDD(scrapeDate)}`);
    }
    return [firstDateInTimeseries, scrapeDate];
  },
  scraper: {
    '0': async function() {
      function sortBy(fld) {
        return function(a, b) {
          if (a[fld] === b[fld]) return 0;
          return a[fld] < b[fld] ? -1 : 1;
        };
      }
      let cases = await fetch.json(this, this._urls.cases, 'cases', false);
      cases = cases.sort(sortBy('date'));

      let patients = await fetch.json(this, this._urls.patients, 'patients', false);
      patients = patients.sort(sortBy('reportdate'));

      let tests = await fetch.json(this, this._urls.tests, 'tests', false);
      tests = tests.sort(sortBy('result_date'));

      function getCaseField(dt, fld) {
        const c = cases.filter(cur => dt === datetime.getYYYYMMDD(cur.date) && cur.case_disposition === fld);
        if (c.length === 0) return 0;
        return c.reduce((acc, curr) => {
          return acc + parse.number(curr.case_count);
        }, 0);
      }

      function getTestedField(dt) {
        const c = tests.filter(cur => dt === datetime.getYYYYMMDD(cur.result_date));
        if (c.length === 0) return 0;
        return c.reduce((acc, curr) => {
          return acc + parse.number(curr.tests);
        }, 0);
      }

      // I don't _believe_ that hospitalizations are incremental, they
      // look to be current state.  Per
      // https://data.sfgov.org/stories/s/wmxr-upyn, the numbers are
      // below 100.  I also don't know what the different fields in
      // the raw data set are, and am reluctant to include this data
      // without understanding it.
      // TODO (scraper) re-enable hospitalizations when we figure out what the data says.
      /*
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
      */

      const allDates = []
        .concat(cases.map(c => c.date))
        .concat(patients.map(p => p.reportdate))
        .concat(tests.map(t => t.result_date))
        .sort() // Assuming that all follow same yyyy-mm-dd format!
        .map(s => s.split('T')[0]);
      const [firstDate, scrapeDate] = this._getScrapeDateBounds(datetime.scrapeDate() || new Date(), allDates);
      const scrapeDateString = datetime.getYYYYMMDD(scrapeDate);

      const timeSeries = {};
      let runningCases = 0;
      let runningDeaths = 0;
      let runningTested = 0;
      for (let d = firstDate; datetime.getYYYYMMDD(d) <= scrapeDateString; d.setDate(d.getDate() + 1)) {
        const currYYYYMMDD = datetime.getYYYYMMDD(d);

        runningCases += getCaseField(currYYYYMMDD, 'Confirmed');
        runningDeaths += getCaseField(currYYYYMMDD, 'Death');
        runningTested += getTestedField(currYYYYMMDD);

        timeSeries[currYYYYMMDD] = {
          cases: runningCases,
          deaths: runningDeaths,
          // hospitalized: 0,
          tested: runningTested
        };
      }

      // console.table(timeSeries);
      return timeSeries[scrapeDateString];
    }
  }
};

export default scraper;
