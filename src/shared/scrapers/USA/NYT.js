import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import * as geography from '../../lib/geography/index.js';
import datetime from '../../lib/datetime/index.js';

const scraper = {
  url: 'https://github.com/nytimes/covid-19-data',
  type: 'csv',
  country: 'USA',
  timeseries: true,
  aggregate: 'county',
  priority: -1,
  curators: [
    {
      name: 'The New York Times',
      url: 'http://nytimes.com/',
      twitter: '@nytimes',
      github: 'nytimes'
    }
  ],
  async scraper() {
    this.url = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv';
    const data = await fetch.csv(this.url, false);

    // FIXME when we roll out new TZ support!
    const fallback = process.env.USE_ISO_DATETIME ? new Date(datetime.now.at('America/New_York')) : datetime.getDate();
    let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : fallback;
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

    const locations = [];
    const locationsByState = {};
    for (const row of data) {
      if (datetime.getYYYYMD(`${row.date} 12:00:00`) === scrapeDateString) {
        const locationObj = {
          state: geography.getState(row.state),
          cases: parse.number(row.cases),
          deaths: parse.number(row.deaths)
        };
        locationsByState[locationObj.state] = locationsByState[locationObj.state] || [];
        if (row.county.toLowerCase().match(/city$/)) {
          // Data is not for a county
          // Todo: Check our citycounty to county map
          locationObj.city = row.county;
        } else {
          locationObj.county = geography.getCounty(row.county, row.state);

          if (locationObj.county === '(unassigned)') {
            // Skip unassigned locations from NYT, otherwise they mess up rollup totals
            continue;
          }
        }
        locationsByState[locationObj.state].push(locationObj);
        locations.push(locationObj);
      }
    }

    // Roll-up states
    for (const [state, stateLocations] of Object.entries(locationsByState)) {
      locations.push(transform.sumData(stateLocations, { state }));
    }

    if (locations.length === 0) {
      throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${scrapeDateString}`);
    }

    return locations;
  }
};

export default scraper;
