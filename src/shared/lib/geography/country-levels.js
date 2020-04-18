/* eslint-disable no-use-before-define */

import assert from 'assert';
import path from 'path';
import { readJSON } from '../fs.js';
import * as geography from './index.js';

const LEVELS = ['iso1', 'iso2', 'fips'];

const levelCache = {};
const countryLevelsDir = path.dirname(require.resolve('country-levels/package.json'));

export function isId(str) {
  if (Array.isArray(str)) {
    return false;
  }
  if (!str) return false;
  const [level, code] = str.split(':');
  return LEVELS.includes(level) && Boolean(code);
}

export function getIdFromLocation(location) {
  const smallestLocationStr = geography.getSmallestLocationStr(location);
  return isId(smallestLocationStr) ? smallestLocationStr : null;
}

/**
 * @param {string} id
 */
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
  // Return an array of aggregated features
  if (id.includes('+')) {
    const parts = id.split('+');
    const data = await Promise.all(parts.map(getLocationData));
    return data;
  }
  const { level, code } = splitId(id);
  const levelData = await getLevelData(level);
  const locationData = levelData[code];

  assert(locationData, `Country Level data missing for: ${id}`);

  return locationData;
};

export const getFeature = async id => {
  const locationData = await getLocationData(id);
  if (Array.isArray(locationData)) {
    const features = await Promise.all(locationData.map(l => getFeature(l.countrylevel_id)));
    const newGeometry = combineFeatureGeometry(features);
    const newFeature = {
      type: 'Feature',
      properties: {
        name: await getName(id),
        countrylevel_id: id
      },
      geometry: newGeometry
    };
    return newFeature;
  }

  assert(locationData.geojson_path, `Missing geojson_path for ${id}`);

  const geojsonPath = path.join(countryLevelsDir, 'geojson', locationData.geojson_path);
  const feature = await readJSON(geojsonPath);
  const cleanProps = {
    name: feature.properties.name,
    countrylevel_id: feature.properties.countrylevel_id
  };
  feature.properties = cleanProps;
  return feature;
};

export const getPopulation = async id => {
  const locationData = await getLocationData(id);
  if (Array.isArray(locationData)) {
    return locationData.reduce((a, l) => {
      a += l.population;
      return a;
    }, 0);
  }

  return locationData.population;
};

export const getName = async id => {
  const locationData = await getLocationData(id);
  if (Array.isArray(locationData)) {
    return locationData.map(l => l.name).join(', ');
  }
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

export const combineFeatureGeometry = features => {
  const newGeometry = { type: 'MultiPolygon', coordinates: [] };

  for (const feature of features) {
    const geomType = feature.geometry.type;
    if (geomType === 'Polygon') {
      // Wrap the coords in an array so that it looks like a MultiPolygon.
      newGeometry.coordinates = newGeometry.coordinates.concat([feature.geometry.coordinates]);
    } else if (geomType === 'MultiPolygon') {
      newGeometry.coordinates = newGeometry.coordinates.concat(feature.geometry.coordinates);
    } else {
      throw new Error(`Invalid geometry type ${feature.properties.countrylevel_id} ${geomType}`);
    }
  }
  return newGeometry;
};
