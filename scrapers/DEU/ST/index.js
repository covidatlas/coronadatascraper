import * as fetch from '../../../lib/fetch.js';
import * as datetime from '../../../lib/datetime.js';

const scraper = {
  state: 'ST',
  country: 'DEU',
  timeseries: true,
  url: 'https://covid19-germany.appspot.com/timeseries/DE-ST',
  type: 'json',
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com'
    }
  ],
  sources: [
    {
      url: 'https://github.com/jgehrcke/covid-19-germany-gae',
      name: 'covid-19-germany-gae',
      description: 'Official numbers published by public health offices (Gesundheitsaemter) in Germany'
    }
  ],
  async scraper() {
    const dcases = await fetch.json(`${this.url}/cases`);
    const scrapeDate = process.env.SCRAPE_DATE ? process.env.SCRAPE_DATE : datetime.getYYYYMMDD();

    let latestDate = new Date(Object.keys(dcases.data[dcases.data.length - 1])[0]);

    if (datetime.dateIsBefore(latestDate, scrapeDate)) {
      console.error('🚨 Timeseries for DEU-%s has not been updated, latest date is using %s instead of %s', this.state, datetime.getYYYYMMDD(latestDate), datetime.getYYYYMMDD(scrapeDate));
      latestDate = datetime.getYYYYMMDD(latestDate, '-');
    } else {
      latestDate = datetime.getYYYYMMDD(scrapeDate, '-');
    }

    const ddeaths = await fetch.json(`${this.url}/deaths`);

    return {
      country: this.country,
      state: this.state,
      cases: Object.values(dcases.data[dcases.data.length - 1])[0],
      deaths: Object.values(ddeaths.data[dcases.data.length - 1])[0],
      coordinates: [11.28, 51.58],
      population: 2.208 * 10 ** 6
    };
  }
};

export default scraper;
