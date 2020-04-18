import * as fetch from '../../../lib/fetch/index.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-MT',
  country: 'iso1:US',
  url:
    'https://services.arcgis.com/qnjIrwR8z5Izc0ij/arcgis/rest/services/PUBLIC_VIEW_COVID19_CASES/FeatureServer/0/query',
  type: 'json',
  aggregate: 'county',

  _counties: [
    'Beaverhead County',
    'Big Horn County',
    'Blaine County',
    'Broadwater County',
    'Carbon County',
    'Carter County',
    'Cascade County',
    'Chouteau County',
    'Custer County',
    'Daniels County',
    'Dawson County',
    'Deer Lodge County',
    'Fallon County',
    'Fergus County',
    'Flathead County',
    'Gallatin County',
    'Garfield County',
    'Glacier County',
    'Golden Valley County',
    'Granite County',
    'Hill County',
    'Jefferson County',
    'Judith Basin County',
    'Lake County',
    'Lewis and Clark County',
    'Liberty County',
    'Lincoln County',
    'McCone County',
    'Madison County',
    'Meagher County',
    'Mineral County',
    'Missoula County',
    'Musselshell County',
    'Park County',
    'Petroleum County',
    'Phillips County',
    'Pondera County',
    'Powder River County',
    'Powell County',
    'Prairie County',
    'Ravalli County',
    'Richland County',
    'Roosevelt County',
    'Rosebud County',
    'Sanders County',
    'Sheridan County',
    'Silver Bow County',
    'Stillwater County',
    'Sweet Grass County',
    'Teton County',
    'Toole County',
    'Treasure County',
    'Valley County',
    'Wheatland County',
    'Wibaux County',
    'Yellowstone County'
  ],

  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);
    let countyAttributes;
    if (datetime.dateIsBefore(date, datetime.ARCGIS_PAGINATION_DEPLOY_DATE)) {
      // FIXME: ugly hack to not get cache misses. We should be able to remove this in li.
      this.url =
        'https://services.arcgis.com/qnjIrwR8z5Izc0ij/arcgis/rest/services/PUBLIC_VIEW_COVID19_CASES/FeatureServer/0/query?f=json&where=Total%20%3C%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=NAMELABEL%20asc&resultOffset=0&resultRecordCount=56&cacheHint=true';
      const data = await fetch.json(this, this.url, 'default');
      countyAttributes = data.features.map(({ attributes }) => attributes);
    } else {
      countyAttributes = await fetch.arcGISJSON(this, this.url, 'default', false);
    }

    let counties = [];

    for (const rec of countyAttributes) {
      const county = geography.addCounty(rec.NAMELABEL);
      const cases = rec.Total;

      counties.push({
        county,
        cases
      });
    }

    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
