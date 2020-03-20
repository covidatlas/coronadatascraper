import * as fetch from '../../../lib/fetch.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'DEU',
  state: 'DE-BY', // ISO 3166 notation
  url: 'https://covid19-germany.appspot.com/',
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
      description: 'Fresh data obtained from Bavarian health ministry by ZEIT ONLINE'
    }
  ],
  async scraper() {
    const queryDayString = datetime.getYYYYMD(new Date(process.env.SCRAPE_DATE));
    const data = await fetch.csv('https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv');

    let queryDayCases = 0;
    let queryDayDeaths = 0;

    if (process.env.SCRAPE_DATE) {
      // Get historical data for a specific day.
      for (const row of data) {
        const sampleDayString = datetime.getYYYYMD(new Date(row.time_iso8601));
        if (sampleDayString === queryDayString) {
          queryDayCases = row['DE-BY_cases'];
          queryDayDeaths = row['DE-BY_deaths'];
        }
      }
    } else {
      // Rely on last entry in time series to be rather fresh.
      const [lastRow] = data.slice(-1);
      queryDayCases = lastRow['DE-BY_cases'];
      queryDayDeaths = lastRow['DE-BY_deaths'];
    }
    return {
      country: 'DEU',
      state: 'DE-BY',
      cases: parseInt(queryDayCases, 10),
      deaths: parseInt(queryDayDeaths, 10),
      recovered: undefined, // no credible data from Germany yet
      coordinates: [11.497, 48.79],
      population: 13 * 10 ** 6
    };
  }
};

export default scraper;
