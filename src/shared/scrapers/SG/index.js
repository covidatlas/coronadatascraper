import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import maintainers from '../../lib/maintainers.js';

/**
 * Hand rolled version of _.groupBy
 *
 * @param {object[]} array
 * @param {(object) => string} func - Get the key to group by.
 * @returns {object} Where key is the result of the function, and the value is an array of the values that match.
 */
const groupBy = (array, func) => {
  return array.reduce((previousValue, currentValue) => {
    const currentKey = func(currentValue);
    const oldVersionOfCurrentKey = previousValue[currentKey] || [];
    return { ...previousValue, [currentKey]: [...oldVersionOfCurrentKey, currentValue] };
  }, {});
};

const scraper = {
  country: `iso1:SG`,
  maintainers: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'Ministry of Health Singapore',
      name: 'Ministry of Health Singapore',
      url: 'https://www.moh.gov.sg/'
    }
  ],
  type: 'json',
  url:
    'https://services6.arcgis.com/LZwBmoXba0zrRap7/ArcGIS/rest/services/COVID_19_Prod_B_feature_CaseDetailView/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=',
  async scraper() {
    const data = await fetch.json(this, this.url, 'default');
    assert(data, 'No data fetched');
    assert(data.features.length > 1, 'features are unreasonable');
    const attributes = data.features.map(({ attributes }) => attributes);
    assert(attributes.length > 1, 'data fetch failed, no attributes');
    const groupedByStatus = groupBy(attributes, attribute => attribute.Status);

    const output = {};
    for (const [statusName, statusItems] of Object.entries(groupedByStatus)) {
      output[statusName] = statusItems.length;
    }
    console.table(output);
    const latestCase = attributes[attributes.length - 1];
    // TODO: This latest case's confirmed date is ages ago, I reckon we're hitting the max attributes limit here.
    return {
      cases: latestCase.Case_total,
      recovered: output.Discharged,
      deaths: output.Deceased,
      hospitalized: output.Hospitalised
    };
  }
};

export default scraper;
