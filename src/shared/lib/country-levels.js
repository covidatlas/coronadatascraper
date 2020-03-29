import * as fs from 'fs';
import * as util from 'util';
import * as fs_ from './fs.js';
import * as geography from './geography/index.js';
import join from './join.js';

const countryLevelCache = {};
const countryLevelsDir = join('src', 'shared', 'vendor', 'country-levels');
const TARGET_VERSION = 'v1.0.0';

export function isId(str) {
  if (!str) return false;
  const [level, code] = str.split(':');
  return ['iso1', 'iso2', 'fips'].includes(level) && !!code;
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

const downloadCountryLevels = async () => {
  const zipURL = `https://github.com/hyperknot/country-levels/releases/download/${TARGET_VERSION}/export_q7.zip`;

  const rmdir = util.promisify(fs.rmdir);
  await rmdir(countryLevelsDir, { recursive: true });
};

const loadCacheIfNeeded = async () => {
  // check cache status on iso1 data
  if (countryLevelCache.iso1) return;
  console.log('  Loading country-levels cache...');

  const versionFile = join(countryLevelsDir, 'version.json');

  let version;
  try {
    version = await fs_.readJSON(versionFile);
    // eslint-disable-next-line no-empty
  } catch {}

  if (version !== TARGET_VERSION) {
    console.log('  country-levels not found, downloading...');
    await downloadCountryLevels();
  }
};

export const getFeature = async id => {
  await loadCacheIfNeeded();
  return;

  const { level, code } = splitId(id, true);
  const geojsonDir = `./coronavirus-data-sources/country-levels/export/geojson/small`;

  let geojsonPath;
  if (['id0', 'id1', 'id2'].includes(level)) {
    geojsonPath = `${geojsonDir}/${level}/${code}.geojson`;
  }

  if (level === 'id3') {
    const { country, state } = splitId3(code, true);
    geojsonPath = `${geojsonDir}/${level}/${country}/${state}.geojson`;
  }

  const feature = await fs_.readJSON(geojsonPath);
  if (!feature) {
    console.error(`  ❌ GeoJSON missing for id: ${id}`);
    return {};
  }
  cleanProperties(feature);
  return feature;
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
