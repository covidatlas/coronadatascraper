import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';
import getIso2FromName from '../../utils/get-iso2-from-name.js';
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

const country = `iso1:JP`;
const scraper = {
  country,
  maintainers: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'Ministry of Health, Labour, and Welfare Japan',
      name: 'Ministry of Health, Labour, and Welfare Japan',
      url: 'https://mhlw-gis.maps.arcgis.com/apps/opsdashboard/index.html#/0c5d0502bbb54f9a8dddebca003631b8/'
    }
  ],
  type: 'json',
  url:
    'https://services8.arcgis.com/JdxivnCyd1rvJTrY/arcgis/rest/services/v2_covid19_list_csv/FeatureServer/0/query?where=0%3D0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson',
  async scraper() {
    const $ = await fetch.json(this, this.url, 'default');
    assert($, 'No data fetched');
    assert($.features.length > 1, 'features are unreasonable');
    const attributes = $.features.map(({ attributes }) => attributes);

    assert(attributes.length > 1, 'data fetch failed, no attributes');

    const groupedByState = groupBy(attributes, attribute => attribute.Prefecture);

    const states = [];
    for (const [stateName, stateAttributes] of Object.entries(groupedByState)) {
      states.push({
        state: getIso2FromName({ country, name: stateName }),
        cases: stateAttributes.length
      });
    }

    const summedData = transform.sumData(states);
    states.push(summedData);

    return states;
  }
};

export default scraper;
