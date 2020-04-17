import * as fetch from '../../lib/fetch/index.js';
import maintainers from '../../lib/maintainers.js';
import datetime from '../../lib/datetime/index.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:LV',
  url: 'https://services7.arcgis.com/g8j6ESLxQjUogx9p/arcgis/rest/services/Latvia_covid_novadi/FeatureServer/0/query',
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [
    {
      url: 'https://arkartassituacija.gov.lv/',
      name: 'Latvia Management of the Center for Disease Prevention and Control'
    }
  ],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    let casesData;
    if (datetime.dateIsBefore(date, datetime.ARCGIS_PAGINATION_DEPLOY_DATE)) {
      // FIXME: ugly hack to not get cache misses. We should be able to remove this in li.
      this.url =
        'https://services7.arcgis.com/g8j6ESLxQjUogx9p/arcgis/rest/services/Latvia_covid_novadi/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=false';
      const casesRaw = await fetch.json(this, this.url, 'default');
      casesData = casesRaw.features.map(({ attributes }) => attributes);
    } else {
      casesData = await fetch.arcGISJSON(this, this.url, 'default', false);
    }

    const data = [];

    for (const item of casesData) {
      data.push({
        state: mapping[item.Nos_pilns] || item.Nos_pilns,
        cases: item.Covid_sasl
      });
    }

    return data;
  }
};

export default scraper;
