import * as fs from './fs.js';
import * as geography from './geography/index.js';

export function isId(str) {
  if (!str) return false;
  const [level, code] = str.split(':');
  return ['iso1', 'iso2', 'fips'].includes(level) && !!code;
}

export function getIdFromLocation(location) {
  const smallestLocationStr = geography.getSmallestLocationStr(location);
  return isId(smallestLocationStr) ? smallestLocationStr : null;
}
//
// export function splitId(id, toLower = false) {
//   if (!isId(id)) {
//     console.error(`  ❌ Wrong id: ${id}`);
//     return {};
//   }
//
//   const id_ = toLower ? id.toLowerCase() : id;
//   const [level, code] = id_.split(':');
//   return { level, code };
// }
//
// export const getFeature = async id => {
//   const { level, code } = splitId(id, true);
//   const geojsonDir = `./coronavirus-data-sources/country-levels/export/geojson/small`;
//
//   let geojsonPath;
//   if (['id0', 'id1', 'id2'].includes(level)) {
//     geojsonPath = `${geojsonDir}/${level}/${code}.geojson`;
//   }
//
//   if (level === 'id3') {
//     const { country, state } = splitId3(code, true);
//     geojsonPath = `${geojsonDir}/${level}/${country}/${state}.geojson`;
//   }
//
//   const feature = await fs.readJSON(geojsonPath);
//   if (!feature) {
//     console.error(`  ❌ GeoJSON missing for id: ${id}`);
//     return {};
//   }
//   cleanProperties(feature);
//   return feature;
// };
//
// export const getPopulation = async id => {
//   const feature = await getFeature(id);
//   if (!feature) {
//     console.error(`  ❌ Population missing for id: ${id}`);
//     return null;
//   }
//   return feature.properties.population;
// };
