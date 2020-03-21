import * as fetch from '../../../lib/fetch.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'DEU',
  state: 'DE-BY', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com'
    }
  ],
  sources: [
    {
      name: 'Robert Koch-Institut, Bavarian health ministry',
      description: 'Fresh data obtained from Bavarian health ministry by ZEIT ONLINE',
      url: 'https://github.com/jgehrcke/covid-19-germany-gae'
    }
  ],
  async scraper() {
    const data = await fetch.csv(this.url);

    function rowToResult(row) {
      return {
        cases: parseInt(row['DE-BY_cases'], 10),
        deaths: parseInt(row['DE-BY_deaths'], 10),
        coordinates: [11.497, 48.79],
        population: 13 * 10 ** 6
      };
    }

    // location string for log and error msgs.
    const loc = `${this.country}, ${this.state}`;

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
    const firstDateInTimeseries = new Date(data.slice(0)[0].time_iso8601);

    // Handle the two special cases where queryDate is before or after the time
    // interval covered by the timeseries.
    if (queryDate > lastDateInTimeseries) {
      console.error(`  🚨 timeseries for ${loc}: SCRAPE_DATE ${queryDayString} is newer than last sample time ${lastDateInTimeseries}. Use last sample anyway`);
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
