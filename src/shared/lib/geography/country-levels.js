import assert from 'assert';
import path from 'path';
import { readJSON } from '../fs.js';
import * as geography from './index.js';

const LEVELS = ['iso1', 'iso2', 'fips'];

const levelCache = {};
const countryLevelsDir = path.dirname(require.resolve('country-levels/license.md'));

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

  const levelData = await readJSON(path.join(countryLevelsDir, `${level}.json`));
  levelCache[level] = levelData;
  return levelCache[level];
};

export const getLocationData = async id => {
  // Split and sum populations for aggregated features (i.e. tricounties)
  if (id.indexOf('+') !== -1) {
    const parts = id.split('+');
    let data = await Promise.all(parts.map(getLocationData));
    data = data.reduce(
      (a, d) => {
        a.population += d.population;
        return a;
      },
      { population: 0 }
    );
    return data;
  }
  const { level, code } = splitId(id, true);
  const levelData = await getLevelData(level);
  const locationData = levelData[code];

  assert(locationData, `Country Level data missing for: ${id}`);

  return locationData;
};

export const getFeature = async id => {
  const locationData = await getLocationData(id);
  if (locationData.geojson_path) {
    const geojsonPath = path.join(countryLevelsDir, 'geojson', locationData.geojson_path);
    const feature = await readJSON(geojsonPath);
    return feature;
  }
  return null;
};

export const getPopulation = async id => {
  const locationData = await getLocationData(id);
  return locationData.population;
};

export const getName = async id => {
  const locationData = await getLocationData(id);
  return locationData.name;
};

// this function transforms ids to Id columns and replaces names
// with human readable version
// it mutates the object
export const transformLocationIds = async location => {
  for (const loc of ['country', 'state', 'county', 'city']) {
    const locId = location[loc];
    if (isId(locId)) {
      location[`${loc}Id`] = locId;
      location[loc] = await getName(locId);
    }
  }
};
