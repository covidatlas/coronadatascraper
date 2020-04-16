import iso2 from 'country-levels/iso2.json';
import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';
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

const countryIso1 = 'JP';
const japanIso2Values = Object.values(iso2).filter(item => item.iso2.startsWith(countryIso1));

const prefectureSpecialCases = {
  Hokkaido: 'Hokkaidō'
};

const getIsoFromPrefectureName = prefectureName => {
  const modifiedName = prefectureSpecialCases[prefectureName] || prefectureName;
  const foundItem = japanIso2Values.find(({ name }) => name.startsWith(modifiedName));
  assert(foundItem, `no item found for ${prefectureName}`);
  return foundItem.countrylevel_id;
};

const scraper = {
  country: `iso1:${countryIso1}`,
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
    const data = await fetch.json(this.url);
    assert(data, 'No data fetched');
    assert(data.features.length > 1, 'features are unreasonable');
    const attributes = data.features.map(({ attributes }) => attributes);
    assert(attributes.length > 1, 'data fetch failed, no attributes');

    const groupedByPrefecture = groupBy(attributes, attribute => attribute.Prefecture);

    const prefectures = [];
    for (const [prefectureName, prefectureAttributes] of Object.entries(groupedByPrefecture)) {
      prefectures.push({
        state: getIsoFromPrefectureName(prefectureName),
        cases: prefectureAttributes.length
      });
    }
    prefectures.push(transform.sumData(prefectures));

    return prefectures;
  }
};

export default scraper;
