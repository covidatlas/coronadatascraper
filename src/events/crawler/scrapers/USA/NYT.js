import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as geography from '../../lib/geography.js';
import * as datetime from '../../lib/datetime.js';

const scraper = {
  url: 'https://github.com/nytimes/covid-19-data',
  type: 'csv',
  country: 'USA',
  timeseries: true,
  priority: 1,
  async scraper() {
    this.url = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv';
    const data = await fetch.csv(this.url, false);

    let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : datetime.getDate();
    let scrapeDateString = datetime.getYYYYMD(scrapeDate);
    const lastDateInTimeseries = new Date(`${data[data.length - 1].date} 12:00:00`);
    const firstDateInTimeseries = new Date(`${data[0].date} 12:00:00`);

    if (scrapeDate > lastDateInTimeseries) {
      console.error(
        `  🚨 timeseries for ${geography.getName(
          this
        )}: SCRAPE_DATE ${scrapeDateString} is newer than last sample time ${datetime.getYYYYMD(
          lastDateInTimeseries
        )}. Using last sample anyway`
      );
      scrapeDate = lastDateInTimeseries;
      scrapeDateString = datetime.getYYYYMD(scrapeDate);
    }

    if (scrapeDate < firstDateInTimeseries) {
      throw new Error(`Timeseries starts later than SCRAPE_DATE ${scrapeDateString}`);
    }

    if (scrapeDate < firstDateInTimeseries) {
      throw new Error(`Timeseries starts later than SCRAPE_DATE ${scrapeDateString}`);
    }

    const locations = [];
    for (const row of data) {
      if (datetime.getYYYYMD(`${row.date} 12:00:00`) === scrapeDateString) {
        const locationObj = {
          state: geography.getState(row.state),
          cases: parse.number(row.cases),
          deaths: parse.number(row.deaths)
        };
        if (row.county.toLowerCase().match(/city$/)) {
          // Data is not for a county
          // Todo: Check our citycounty to county map
          locationObj.city = row.county;
        } else {
          locationObj.county = geography.getCounty(row.county, row.state);
        }
        locations.push(locationObj);
      }
    }

    return locations;
  }
};

export default scraper;
