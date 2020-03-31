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
  return LEVELS.includes(level) && Boolean(code);
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

  const geojsonPath = path.join(countryLevelsDir, 'geojson', locationData.geojson_path);
  const feature = await readJSON(geojsonPath);
  return feature;
};

export const getPopulation = async id => {
  let locationData;
  try {
    locationData = await getLocationData(id);
  } catch (err) {
    console.error(err);
    return;
  }

  return locationData.population;
};
