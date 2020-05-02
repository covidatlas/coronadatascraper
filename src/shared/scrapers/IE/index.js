import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:IE',
  url:
    'http://opendata-geohive.hub.arcgis.com/datasets/d9be85b30d7748b5b7c09450b8aede63_0.csv?outSR={"latestWkid":3857,"wkid":102100}',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [
    {
      url: 'https://data.gov.ie/',
      name: 'Ireland Open Data Portal'
    }
  ],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesData = await fetch.csv(this, this.url, 'default', false);

    const casesByRegion = {};

    for (const item of casesData) {
      // item.TimeStamp appears to sometimes be a date (eg,
      // "2020-04-27T18:13:20.273Z"), and sometimes an integer for the
      // epoch time (eg, 1585082918049, an _integer_ = milliseconds
      // from Jan 1, 1970).  The Date constructor handles both of
      // these.  On 2020-4-28, US/Missouri switched from recording
      // dates as UTC to epoch, perhaps this was a common change.
      let ts = item.TimeStamp;
      // If using epoch, make it an int for Date constructor.
      if (ts.match(/^\d+$/)) ts = parseInt(ts, 10);
      const timeStamp = new Date(ts);

      if (datetime.dateIsBeforeOrEqualTo(timeStamp, date)) {
        casesByRegion[item.CountyName] = parse.number(item.ConfirmedCovidCases);
      }
    }

    const data = [];

    for (const region of Object.keys(casesByRegion)) {
      data.push({
        state: mapping[region],
        cases: casesByRegion[region]
      });
    }

    return data;
  }
};

export default scraper;
