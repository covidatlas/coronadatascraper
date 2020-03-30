import path from 'path';
import { folderFromZipURL } from './fetch/utils.js';
import { readJSON } from './fs.js';
import * as geography from './geography/index.js';

const LEVELS = ['iso1', 'iso2', 'fips'];
const TARGET_VERSION = 'v1.0.1';

const levelCache = {};
const countryLevelsDir = path.join('src', 'shared', 'vendor', 'country-levels');

export function isId(str) {
  if (!str) return false;
  const [level, code] = str.split(':');
  return LEVELS.includes(level) && !!code;
}

export function getIdFromLocation(location) {
  const smallestLocationStr = geography.getSmallestLocationStr(location);
  return isId(smallestLocationStr) ? smallestLocationStr : null;
}

export function splitId(id) {
  if (!isId(id)) {
    console.error(`  ❌ Wrong id: ${id}`);
    return {};
  }

  const [level, code] = id.split(':');
  return { level, code };
}

const getLevelData = async level => {
  if (!LEVELS.includes(level)) {
    throw new Error(`Country Level ID: not supported ${level}`);
  }

  if (levelCache[level]) {
    return levelCache[level];
  }

  console.log(`Loading Country Levels data for ${level}`);

  const zipURL = `https://github.com/hyperknot/country-levels/releases/download/${TARGET_VERSION}/export_q7.zip`;

  await folderFromZipURL(zipURL, countryLevelsDir);

  const levelData = await readJSON(path.join(countryLevelsDir, `${level}.json`));
  levelCache[level] = levelData;
  return levelCache[level];
};

export const getLocationData = async id => {
  const { level, code } = splitId(id, true);
  const levelData = await getLevelData(level);
  const locationData = levelData[code];

  if (!locationData) {
    throw new Error(`  ❌ Country Level data missing for: ${id}`);
  }

  return locationData;
};

export const getFeature = async id => {
  let locationData;
  try {
    locationData = await getLocationData(id);
  } catch (err) {
    console.error(err);
    return;
  }

  const geojsonPath = locationData.geojson_path;
  console.log(geojsonPath);
  return;

  const geojsonDir = `./coronavirus-data-sources/country-levels/export/geojson/small`;
  //
  // // let geojsonPath;
  // if (['id0', 'id1', 'id2'].includes(level)) {
  //   geojsonPath = `${geojsonDir}/${level}/${code}.geojson`;
  // }
  //
  // if (level === 'id3') {
  //   const { country, state } = splitId3(code, true);
  //   geojsonPath = `${geojsonDir}/${level}/${country}/${state}.geojson`;
  // }
  //
  // const feature = await fs_.readJSON(geojsonPath);
  // if (!feature) {
  //   console.error(`  ❌ GeoJSON missing for id: ${id}`);
  //   return {};
  // }
  // cleanProperties(feature);
  // return feature;
};

export const getPopulation = async id => {
  return;
  const feature = await getFeature(id);
  if (!feature) {
    console.error(`  ❌ Population missing for id: ${id}`);
    return null;
  }
  return feature.properties.population;
};
