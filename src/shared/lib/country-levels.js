import assert from 'assert';
import path from 'path';
import { folderFromZipURL } from './fetch/utils.js';
import { readJSON } from './fs.js';
import * as geography from './geography/index.js';

const TARGET_VERSION = 'v1.1.0';
const LEVELS = ['iso1', 'iso2', 'fips'];

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
  assert(isId(id), `Wrong id: ${id}`);
  const [level, code] = id.split(':');
  return { level, code };
}

const getLevelData = async level => {
  assert(LEVELS.includes(level), `Country Level ID: not supported ${level}`);

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

  assert(locationData, `Country Level data missing for: ${id}`);

  return locationData;
};

export const getFeature = async id => {
  const locationData = await getLocationData(id);
  const geojsonPath = path.join(countryLevelsDir, 'geojson', locationData.geojson_path);
  const feature = await readJSON(geojsonPath);
  return feature;
};

export const getPopulation = async id => {
  const locationData = await getLocationData(id);
  return locationData.population;
};

export const getName = async id => {
  const locationData = await getLocationData(id);
  return locationData.name_long || locationData.name;
};
