import * as fetch from '../../../lib/fetch.js';
import * as datetime from '../../../lib/datetime.js';

const scraper = {
  state: 'HH',
  country: 'DEU',
  timeseries: true,
  url: 'https://covid19-germany.appspot.com/timeseries/DE-HH',
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
      country: 'DEU',
      state: 'HH',
      cases: Object.values(dcases.data[dcases.data.length - 1])[0],
      deaths: Object.values(ddeaths.data[dcases.data.length - 1])[0],
      coordinates: [9.9937, 53.5511],
      population: 1.822 * 10 ** 6
    };
  }
};

export default scraper;
