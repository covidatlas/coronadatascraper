import * as fetch from '../../../lib/fetch/index.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import maintainers from '../../../lib/maintainers.js';
import datetime from '../../../lib/datetime/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-VT',
  country: 'iso1:US',
  sources: [
    {
      url: 'https://www.healthvermont.gov/response/coronavirus-covid-19',
      name: 'Vermont Department of Health'
    }
  ],
  url: 'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/VT_Counties_Cases/FeatureServer/0/query',
  type: 'json',
  aggregate: 'county',
  maintainers: [maintainers.aed3],
  _counties: [
    'Orleans County',
    'Grand Isle County',
    'Chittenden County',
    'Windsor County',
    'Windham County',
    'Bennington County',
    'Franklin County',
    'Essex County',
    'Lamoille County',
    'Caledonia County',
    'Orange County',
    'Washington County',
    'Rutland County',
    'Addison County'
  ],
  scraper: {
    '0': async function() {
      const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);
      let countyAttributes;
      if (datetime.dateIsBefore(date, datetime.ARCGIS_PAGINATION_DEPLOY_DATE)) {
        // FIXME: ugly hack to not get cache misses. We should be able to remove this in li.
        this.url =
          'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/VT_Counties_Cases/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*';
        const data = await fetch.json(this, this.url, 'default');
        countyAttributes = data.features.map(({ attributes }) => attributes);
      } else {
        countyAttributes = await fetch.arcGISJSON(this, this.url, 'default', false);
      }

      const counties = [];

      countyAttributes.forEach(item => {
        const cases = item.Cases;
        const deaths = item.Deaths;
        let county = geography.addCounty(item.Label);

        if (county.includes('Pending Validation')) {
          county = UNASSIGNED;
        }

        counties.push({
          county,
          cases,
          deaths
        });
      });

      let totalsurl =
        'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/county_summary/FeatureServer/0/query';
      let totalsData;
      if (datetime.dateIsBefore(date, datetime.ARCGIS_PAGINATION_DEPLOY_DATE)) {
        // FIXME: ugly hack to not get cache misses. We should be able to remove this in li.
        totalsurl =
          'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/county_summary/FeatureServer/0/query?where=1%3D1&outFields=*&f=pjson';
        const data = await fetch.json(this, totalsurl, 'totals');
        [totalsData] = data.features.map(({ attributes }) => attributes);
      } else {
        [totalsData] = await fetch.arcGISJSON(this, totalsurl, 'totals', false);
      }
      const totals = transform.sumData(counties);
      totals.tested = totalsData.total_tests;

      counties.push(totals);
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
