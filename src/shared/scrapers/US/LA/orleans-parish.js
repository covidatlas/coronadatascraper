import * as fetch from '../../../lib/fetch/index.js';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  county: 'fips:22071',
  state: 'iso2:US-LA',
  country: 'iso1:US',
  url:
    'https://gis.nola.gov/arcgis/rest/services/apps/LDH_Data/MapServer/0/query?f=json&where=Date%3Etimestamp%20%272020-03-18%2003%3A59%3A59%27&returnGeometry=falses&outFields=*&orderByFields=Date%20asc&resultOffset=0&resultRecordCount=1000',
  sources: [
    {
      name: 'City of New Orleans Office of Homeland Security and Emergency Preparedness',
      url: 'https://ready.nola.gov/incident/coronavirus/safe-reopening/',
      description: 'City of New Orleans Office of Homeland Security and Emergency Preparedness'
    }
  ],
  _counties: ['Orleans Parish'],
  timeseries: true,
  aggregate: 'county',
  type: 'json',
  maintainers: [maintainers.sglyon],
  scraper: {
    '0': async function() {
      const data = await fetch.json(this, this.url, 'default', false);

      let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : new Date();
      console.log(process.env.SCRAPE_DATE);
      let scrapeDateString = datetime.parse(new Date(scrapeDate)).toString();
      const Nfeatures = data.features.length;
      const lastDateInTimeseries = new Date(data.features[Nfeatures - 1].attributes.Date);
      const firstDateInTimeseries = new Date(data.features[0].attributes.Date);

      if (scrapeDate > lastDateInTimeseries) {
        console.error(
          `  🚨 timeseries for US/LA/orleans-parish: SCRAPE_DATE ${datetime.getYYYYMD(
            scrapeDate
          )} is newer than last sample time ${datetime.getYYYYMD(lastDateInTimeseries)}. Using last sample anyway`
        );
        scrapeDate = lastDateInTimeseries;
        scrapeDateString = datetime.parse(scrapeDate).toString();
      }

      if (scrapeDate < firstDateInTimeseries) {
        throw new Error(`Timeseries starts later than SCRAPE_DATE ${datetime.getYYYYMD(scrapeDate)}`);
      }

      const parsed = {};

      for (const row of data.features) {
        const attrs = row.attributes;
        const date = new Date(attrs.Date);
        const dateStr = datetime.parse(date).toString();
        const obj = {
          county: this.county,
          cases: attrs.NO_Cases,
          deaths: attrs.NO_Deaths,
          tested: attrs.NO_Total_Tests,
          date: dateStr,
          icu_current: attrs.R1_ICU_Beds_In_Use,
          hospitalized_current: attrs.R1_Beds_In_Use
        };
        parsed[dateStr] = obj;
      }
      return parsed[scrapeDateString];
    }
  }
};

export default scraper;
