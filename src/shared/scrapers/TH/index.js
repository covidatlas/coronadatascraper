import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'iso1:TH',
  maintainers: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'Department of Disease Control Thailand',
      name: 'Department of Disease Control Thailand',
      url: 'https://ddc.moph.go.th/'
    }
  ],
  type: 'json',
  url:
    'https://ddcportal.ddc.moph.go.th/arcgis/rest/services/iT_Neillgis/thai_cities/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&multipatchOption=xyFootprint&resultOffset=&resultRecordCount=&returnTrueCurves=false&returnExceededLimitFeatures=false&quantizationParameters=&returnCentroid=false&sqlFormat=none&resultType=&featureEncoding=esriDefault&f=pjson',
  async scraper() {
    const data = await fetch.json(this, this.url, 'default');
    assert(data, 'No data fetched');
    assert.equal(data.features.length, 1, 'more features added, we may be scraping the wrong thing');
    const { attributes } = data.features[0];
    assert(attributes, 'data fetch failed, no attributes');
    const output = {
      cases: attributes.Confirmed,
      deaths: attributes.Deaths,
      icu: attributes.Critical,
      recovered: attributes.Recovered
    };
    assert(output.cases > 0, 'Cases is not reasonable');
    return output;
  }
};

export default scraper;
