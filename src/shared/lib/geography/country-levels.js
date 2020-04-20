/* eslint-disable no-use-before-define */

import assert from 'assert';

import fips from 'country-levels/fips.json';
import iso1 from 'country-levels/iso1.json';
import iso2 from 'country-levels/iso2.json';

import path from 'path';
import { readJSON } from '../fs.js';
import * as geography from './index.js';

const levels = {
  iso1,
  iso2,
  fips
};

const countryLevelsDir = path.dirname(require.resolve('country-levels/package.json'));

export function isId(str) {
  if (Array.isArray(str)) {
    return false;
  }
  if (!str) return false;
  const [level, code] = str.split(':');
  return level in levels && Boolean(code);
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

const getLevelData = level => {
  assert(level in levels, `Country Level ID: not supported ${level}`);
  return levels[level];
};

export const getLocationData = id => {
  // Return an array of aggregated features
  if (id.includes('+')) {
    const parts = id.split('+');
    const data = parts.map(getLocationData);
    return data;
  }
  const { level, code } = splitId(id);
  const levelData = getLevelData(level);
  const locationData = levelData[code];

  assert(locationData, `Country Level data missing for: ${id}`);

  return locationData;
};

export const getFeature = async id => {
  const locationData = getLocationData(id);
  if (Array.isArray(locationData)) {
    const features = await Promise.all(locationData.map(l => getFeature(l.countrylevel_id)));
    const newGeometry = combineFeatureGeometry(features);
    const newFeature = {
      type: 'Feature',
      properties: {
        name: getName(id),
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

export const getPopulation = id => {
  const locationData = getLocationData(id);
  if (Array.isArray(locationData)) {
    return locationData.reduce((a, l) => {
      a += l.population;
      return a;
    }, 0);
  }

  return locationData.population;
};

export const getName = id => {
  const locationData = getLocationData(id);
  if (Array.isArray(locationData)) {
    return locationData.map(l => l.name).join(', ');
  }
  return locationData.name;
};

export const getTimezone = id => {
  const locationData = getLocationData(id);
  if (Array.isArray(locationData)) {
    return locationData[0].timezone || 'UTC';
  }
  return locationData.timezone || 'UTC';
};

// this function transforms ids to Id columns and replaces names
// with human readable version
// it mutates the object
export const transformLocationIds = location => {
  for (const loc of ['country', 'state', 'county', 'city']) {
    const locId = location[loc];
    if (isId(locId)) {
      location[`${loc}Id`] = locId;
      location[loc] = getName(locId);
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
