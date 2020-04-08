import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';
import log from '../../lib/log.js';
import * as geography from '../../lib/geography/index.js';
import * as parse from '../../lib/parse.js';

const scraper = {
  country: 'UKR',
  sources: [
    {
      url: 'https://www.rnbo.gov.ua/en/',
      name: 'National Security and Defense Council of Ukraine\n'
    }
  ],
  // Ukraine's URL needs to have the date on it. So this will actually be
  // changed by the code below.
  url: 'https://api-covid19.rnbo.gov.ua/data?to=', // append this with YYYY-MM-DD
  type: 'json',
  aggregate: 'state',
  maintainers: [maintainers.ciscorucinski], // create an entry in maintainers.js
  scraper: {
    '0': async function() {
      const regions = [];
      let date = process.env.SCRAPE_DATE;
      date = datetime.getYYYYMMDD(date);
      this.url += date;
      const data = await fetch.json(this.url, false, { disableSSL: true });
      if (data === null) {
        throw new Error(`UKR: failed to fetch data from ${this.url}.`);
      }
      for (const region of data.ukraine) {
        regions.push({
          county:
            region.label.en === 'Kyiv'
              ? geography.addCounty(region.label.en, 'city')
              : geography.addCounty(region.label.en, 'region'),
          cases: parse.number(region.confirmed),
          deaths: parse.number(region.deaths),
          recovered: parse.number(region.recovered),
          coordinates: [region.lng, region.lat]
        });
      }
      log(regions);
      return regions;
    }
  }
};
export default scraper;
