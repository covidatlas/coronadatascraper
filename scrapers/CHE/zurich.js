import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as datetime from '../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'CHE',
  county: 'Zurich',
  url: 'https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Fallzahlen_Kanton_ZH_total.csv',
  timeseries: true,
  async scraper() {
    const data = await fetch.csv(this.url, false);
    let latestData;
    if (process.env.SCRAPE_DATE) {
      const date = datetime.getDDMMYYYY(new Date(process.env.SCRAPE_DATE), '.');
      [latestData] = data.filter(dayData => dayData.Date === date);
    } else {
      latestData = data[data.length - 1];
    }
    return {
      recovered: parse.number(latestData.TotalCured),
      deaths: parse.number(latestData.TotalDeaths),
      cases: parse.number(latestData.TotalConfCases),
      tested: parse.number(latestData.TotalTestedCases)
    };
  }
};

export default scraper;
