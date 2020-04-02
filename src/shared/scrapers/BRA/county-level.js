import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import * as geography from '../../lib/geography/index.js';
import datetime from '../../lib/datetime/old/index.js';

import countiesList from './countiesList.json';

const scraper = {
  country: 'BRA',
  type: 'csv',
  priority: 1,
  url: 'https://brasil.io/dataset/covid19/caso?place_type=city&format=csv',
  timeseries: true,
  aggregate: 'county',

  async scraper() {
    const data = await fetch.csv(this.url, false);
    const scrapeDate = process.env.SCRAPE_DATE ? datetime.getYYYYMMDD(process.env.SCRAPE_DATE) : datetime.getYYYYMMDD();
    let latestDate = data[0].date;

    if (datetime.dateIsBefore(latestDate, scrapeDate)) {
      console.error('  🚨 Timeseries for BRA has not been updated, using %s instead of %s', latestDate, scrapeDate);
    } else {
      latestDate = datetime.getYYYYMMDD(scrapeDate);
    }

    let counties = data
      .filter(row => {
        return row.date === latestDate;
      })
      .map(row => {
        return {
          cases: parse.number(row.confirmed),
          deaths: parse.number(row.deaths),
          county: `${parse.string(row.city)}, ${parse.string(row.state)}`,
          state: parse.string(row.state),
          aggregate: 'county'
        };
      });

    counties = geography.addEmptyRegions(counties, countiesList, 'county');
    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
