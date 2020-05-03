import * as fetch from '../../../../lib/fetch/index.js';
import * as parse from '../../../../lib/parse.js';
import datetime from '../../../../lib/datetime/index.js';

const scraper = {
  county: 'fips:32031',
  state: 'iso2:US-NV',
  country: 'iso1:US',
  url:
    'https://www.washoecounty.us/health/programs-and-services/communicable-diseases-and-epidemiology/educational_materials/COVID-19.php',
  sources: [
    {
      name: 'Washoe County Health District',
      url: 'https://www.washoecounty.us/health/',
      description: 'Washoe County, Nevada health department'
    }
  ],
  _counties: ['Washoe County'],
  certValidation: false,
  timeseries: true,
  aggregate: 'county',
  type: 'json',
  scraper: {
    '0': async function() {
      const orgId = 'iCGWaR7ZHc5saRIl';
      const layerName = 'CasesTable_public';
      this.url = `https://services.arcgis.com/${orgId}/arcgis/rest/services/${layerName}/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&orderByFields=reportdt%20asc`;
      this.type = 'json';

      const data = await fetch.json(this, this.url, 'default', false);

      const countyDates = [];
      for (const row of data.features) {
        const countyDate = {
          county: this.county,
          cases: typeof row.attributes.confirmed === 'number' ? parse.number(row.attributes.confirmed) : null,
          active: typeof row.attributes.active === 'number' ? parse.number(row.attributes.active) : null,
          recovered: typeof row.attributes.recovered === 'number' ? parse.number(row.attributes.recovered) : null,
          deaths: typeof row.attributes.deaths === 'number' ? parse.number(row.attributes.deaths) : null,
          tested: typeof row.attributes.tested === 'number' ? parse.number(row.attributes.tested) : null,
          hospitalized:
            typeof row.attributes.Hospitalized === 'number' ? parse.number(row.attributes.Hospitalized) : null,
          discharged:
            typeof row.attributes.ReleasedFromHospital === 'number'
              ? parse.number(row.attributes.ReleasedFromHospital)
              : null,
          date: datetime.parse(row.attributes.MDYYYY).toString()
        };

        Object.keys(countyDate).forEach(key => countyDate[key] == null && delete countyDate[key]);

        // console.info(countyDate);
        countyDates[countyDate.date] = countyDate;
      }

      const latestDateInTimeseries = datetime.parse(Object.keys(countyDates).pop());
      const earliestDateInTimeseries = datetime.parse(Object.keys(countyDates).shift());

      let scrapeDate;
      if (typeof process.env.SCRAPE_DATE === 'undefined') {
        scrapeDate = datetime.getYYYYMMDD(latestDateInTimeseries);
      } else if (
        datetime.parse(process.env.SCRAPE_DATE) < earliestDateInTimeseries ||
        datetime.parse(process.env.SCRAPE_DATE) > latestDateInTimeseries
      ) {
        console.error(
          `🚨 Timeseries for : SCRAPE_DATE ${datetime.getYYYYMMDD(
            process.env.SCRAPE_DATE
          )} is out of sample timeseries (${datetime.getYYYYMMDD(earliestDateInTimeseries)} - ${datetime.getYYYYMMDD(
            latestDateInTimeseries
          )}). Using ${
            datetime.parse(process.env.SCRAPE_DATE) < earliestDateInTimeseries ? 'earliest' : 'latest'
          } sample.`
        );
        if (datetime.parse(process.env.SCRAPE_DATE) < earliestDateInTimeseries) {
          scrapeDate = datetime.getYYYYMMDD(earliestDateInTimeseries);
        } else if (datetime.parse(process.env.SCRAPE_DATE) > latestDateInTimeseries) {
          scrapeDate = datetime.getYYYYMMDD(latestDateInTimeseries);
        }
      } else {
        scrapeDate = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);
      }

      const counties = [];
      Object.keys(countyDates).forEach(function(countyDate) {
        if (countyDate === scrapeDate) {
          counties.push(countyDates[countyDate]);
        }
      });

      // console.info(counties);
      return counties;
    }
  }
};

export default scraper;
