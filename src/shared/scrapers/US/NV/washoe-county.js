import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import datetime from '../../../lib/datetime/index.js';
import * as geography from '../../../lib/geography/index.js';

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
  // timeseries: true,
  aggregate: 'county',
  type: 'table',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $span = $('span:contains("COVID-19 Case Count in Washoe County")');
      const regexCases = /COVID-19 Case Count in Washoe County: (\d+)/;
      const regexRecovered = /COVID-19 Cases Who Fully Recovered: (\d+)/;
      const cases = parse.number(regexCases.exec($span[0].children[0].data)[1]);
      const recovered = parse.number(regexRecovered.exec($span[0].children[2].data)[1]);
      return {
        cases,
        recovered
      };
    },
    '2020-03-26': async function() {
      return {
        cases: 67,
        recovered: 4,
        deaths: 0
      };
    },
    '2020-03-27': async function() {
      this.url = await fetch.getArcGISCSVURL(this, '', 'a54a945cac82424fa4928139ee83f911', 'Cases_current');
      this.type = 'csv';

      const data = await fetch.csv(this, this.url, 'default');
      for (const row of data) {
        return {
          cases: parse.number(row.confirmed),
          deaths: parse.number(row.deaths),
          recovered: parse.number(row.recovered),
          active: parse.number(row.active)
        };
      }
    },
    '2020-04-06': async function() {
      // Couldn't figure out the CSV, so just grabbed the JSON
      this.url =
        'https://services.arcgis.com/iCGWaR7ZHc5saRIl/arcgis/rest/services/Cases_wdemographic_current/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&resultOffset=0&resultRecordCount=50&cacheHint=true';
      this.type = 'json';

      const response = await fetch.json(this, this.url, 'default');
      const data = response.features[0].attributes;
      return {
        cases: parse.number(data.confirmed),
        deaths: parse.number(data.deaths),
        recovered: parse.number(data.recovered),
        active: parse.number(data.active)
      };
    },
    '2020-03-02': async function() {
      const orgId = 'iCGWaR7ZHc5saRIl';
      const layerName = 'CasesTable_public';
      this.url = `https://services.arcgis.com/${orgId}/arcgis/rest/services/${layerName}/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&orderByFields=reportdt%20asc`;
      this.type = 'json';

      const data = await fetch.json(this, this.url, 'default');
      // console.info(data);

      const countyDates = [];
      for (const row of data.features) {
        const countyDate = {
          county: geography.addCounty(parse.string('Washoe County')),
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
        countyDates[countyDate.date] = countyDate;
      }

      const latestDateInTimeseries = datetime.parse(Object.keys(countyDates).pop());
      const earliestDateInTimeseries = datetime.parse(Object.keys(countyDates).shift());
      // console.info([earliestDateInTimeseries,latestDateInTimeseries]);

      let scrapeDate;
      if (typeof process.env.SCRAPE_DATE === 'undefined') {
        scrapeDate = datetime.getYYYYMMDD(latestDateInTimeseries);
      } else if (
        datetime.parse(process.env.SCRAPE_DATE) > latestDateInTimeseries ||
        datetime.parse(process.env.SCRAPE_DATE) < earliestDateInTimeseries
      ) {
        scrapeDate = datetime.getYYYYMMDD(latestDateInTimeseries);
        console.error(
          `🚨 Timeseries for : SCRAPE_DATE ${datetime.getYYYYMMDD(
            scrapeDate
          )} is out of sample timeseries (${datetime.getYYYYMMDD(earliestDateInTimeseries)}-${datetime.getYYYYMMDD(
            latestDateInTimeseries
          )}). Using latest sample.`
        );
      } else {
        scrapeDate = datetime.getYYYYMMDD(latestDateInTimeseries);
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
