import * as fetch from '../../../lib/fetch/index.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import maintainers from '../../../lib/maintainers.js';

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
  url:
    'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/VT_Counties_Cases/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*',
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
      const data = await fetch.json(this, this.url, 'default');
      const counties = [];

      data.features.forEach(item => {
        const cases = item.attributes.Cases;
        const deaths = item.attributes.Deaths;
        let county = geography.addCounty(item.attributes.Label);

        if (county.includes('Pending Validation')) {
          county = UNASSIGNED;
        }

        counties.push({
          county,
          cases,
          deaths
        });
      });

      const totalsurl =
        'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/county_summary/FeatureServer/0/query?where=1%3D1&outFields=*&f=pjson';
      const totalsData = await fetch.json(this, totalsurl, 'totals');
      const totals = transform.sumData(counties);
      totals.tested = totalsData.features.pop().attributes.total_tests;

      counties.push(totals);
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
