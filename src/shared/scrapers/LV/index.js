import * as fetch from '../../lib/fetch/index.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:LV',
  url:
    'https://services7.arcgis.com/g8j6ESLxQjUogx9p/arcgis/rest/services/Latvia_covid_novadi/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=false',
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
    const casesRaw = await fetch.json(this, this.url, 'default');
    const casesData = casesRaw.features.map(({ attributes }) => attributes);

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
