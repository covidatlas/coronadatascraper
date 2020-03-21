import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as datetime from '../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'CHE',
  county: 'Zurich',
  url: 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_ZH_total.csv',
  timeseries: true,
  async scraper() {
    const data = await fetch.csv(this.url, false);
    const scrapeDate = process.env.SCRAPE_DATE ? datetime.getYYYYMMDD(process.env.SCRAPE_DATE) : datetime.getYYYYMMDD();

    let currentData = data[data.length - 1];
    const latestDate = currentData.date;

    if (datetime.dateIsBefore(latestDate, scrapeDate)) {
      console.error('  🚨 Timeseries for Zurich, CHE has not been updated, using %s instead of %s', latestDate, scrapeDate);
    } else {
      [currentData] = data.filter(dayData => dayData.date === scrapeDate);
    }

    if (!currentData) {
      throw new Error(`Zurich, CHE does not have data for ${scrapeDate}`);
    }

    return {
      recovered: parse.number(currentData.ncumul_released),
      deaths: parse.number(currentData.ncumul_deceased),
      cases: parse.number(currentData.ncumul_conf)
    };
  }
};

export default scraper;
