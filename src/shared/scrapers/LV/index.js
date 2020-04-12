import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'iso1:LV',
  url:
    'https://spkc.maps.arcgis.com/apps/webappviewer/index.html?id=593bb3ab785341d5b64de7df14125f21&fbclid=IwAR2TQiXO-z4w2euwe5lSX1r6JLbHKpVLEPlib1K96c2tBHy2p3vDefuA8Aw',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const casesData = await fetch.csv(
      await fetch.getArcGISCSVURLFromOrgId(7, 'g8j6ESLxQjUogx9p', 'Latvia_covid_novadi'),
      false
    );

    console.log(casesData);
  }
};

export default scraper;
