import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import * as geography from '../../lib/geography/index.js';
import * as parse from '../../lib/parse.js';

const states = [
  'iso2:DE-BB',
  'iso2:DE-BE',
  'iso2:DE-BW',
  'iso2:DE-BY',
  'iso2:DE-HB',
  'iso2:DE-HE',
  'iso2:DE-HH',
  'iso2:DE-MV',
  'iso2:DE-NI',
  'iso2:DE-NW',
  'iso2:DE-RP',
  'iso2:DE-SH',
  'iso2:DE-SL',
  'iso2:DE-SN',
  'iso2:DE-ST',
  'iso2:DE-TH'
];

function rowToResult(row) {
  return states.map(state => {
    return {
      state,
      cases: parse.number(row[`${state.slice(5)}_cases`]),
      deaths: parse.number(row[`${state.slice(5)}_deaths`])
    };
  });
}

const scraper = {
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'csv',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Landesgesundheitsminmisterien, Landesgesundheitsämter',
      description:
        'before March 17 based on RKI "situation reports", after that: Landesbehörten, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
      url: 'https://github.com/jgehrcke/covid-19-germany-gae'
    }
  ],
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com',
      url: 'https://gehrcke.de',
      github: 'jgehrcke'
    }
  ],
  maintainers: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com',
      url: 'https://gehrcke.de',
      github: 'jgehrcke'
    }
  ],
  country: 'iso1:DE',
  async scraper() {
    const data = await fetch.csv(this, this.url, 'default', false);

    // Rely on dataset to be sorted by time, in direction past -> future.
    const [lastRow] = data.slice(-1);

    if (!process.env.SCRAPE_DATE) {
      // We're asked to return the current state. Rely on last entry in time
      // series to be fresh and return that.
      return rowToResult(lastRow);
    }

    // Get historical data for a specific day.
    const queryDate = new Date(process.env.SCRAPE_DATE);
    const queryDayString = datetime.getYYYYMD(queryDate);
    const lastDateInTimeseries = new Date(lastRow.time_iso8601);
    const lastDateInTimeseriesString = datetime.getYYYYMD(lastDateInTimeseries);
    const firstDateInTimeseries = new Date(data.slice(0)[0].time_iso8601);

    // Handle the two special cases where queryDate is before or after the time
    // interval covered by the timeseries.
    if (queryDate > lastDateInTimeseries) {
      console.error(
        `  🚨 timeseries for ${geography.getName(
          this
        )}: SCRAPE_DATE ${queryDayString} is newer than last sample time ${lastDateInTimeseriesString}. Use last sample anyway`
      );
      return rowToResult(lastRow);
    }

    if (queryDate < firstDateInTimeseries) {
      throw new Error(`Timeseries starts later than SCRAPE_DATE ${queryDayString}`);
    }

    // Search through time series for the query date.
    for (const row of data) {
      if (datetime.getYYYYMD(new Date(row.time_iso8601)) === queryDayString) {
        return rowToResult(row);
      }
    }

    // Special case where time series has a hole.
    throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${queryDayString}`);
  }
};

export default scraper;
