import assert from 'assert';
import iso1Codes from 'country-levels/iso1.json';
import iso3to2 from '../../vendor/iso3to2.json';
import strippedCountyMap from '../../vendor/usa-countymap-stripped.json';
import usStates from '../../vendor/usa-states.json';
import log from '../log.js';

export { usStates };

const UNASSIGNED = '(unassigned)';

export const isCountry = function(location) {
  return location && location.country && !location.state && !location.county && !location.city;
};

export const isState = function(location) {
  return location && location.state && !location.county && !location.city;
};

export const isCounty = function(location) {
  return location && location.county && !location.city;
};

export const isCity = function(location) {
  return location && location.city;
};

export const getSmallestLocationStr = function(location) {
  const smallestStr = location.city || location.county || location.state || location.country;
  assert(smallestStr, `Illegal location: ${JSON.stringify(location)}`);
  return smallestStr;
};

export const getLocationGranularityName = function(location) {
  if (isCountry(location)) {
    return 'country';
  }
  if (isState(location)) {
    return 'state';
  }
  if (isCounty(location)) {
    return 'county';
  }
  if (isCity(location)) {
    return 'city';
  }
  return 'none';
};

/** Get the full name of a location
 * @param {{ city: string?; county: string?; state: string?; country: string?; }} location
 */
export const getName = function(location) {
  return location.name || [location.city, location.county, location.state, location.country].filter(Boolean).join(', ');
};

/*
  Get the priority of a location
*/
export const getPriority = function(location) {
  return location.priority !== undefined ? location.priority : 0;
};

/*
  Normalize the country as a 2-letter string
*/
export const toISO3166Alpha2 = function(country) {
  if (iso1Codes[country]) {
    return country;
  }
  if (iso3to2[country]) {
    return iso3to2[country];
  }

  for (const [iso2, properties] of Object.entries(iso1Codes)) {
    if (properties.name === country) {
      return iso2;
    }
  }

  log.warn('⚠️  Could not find ISO-3166 alpha 2 country code for', country);
  return country;
};

/*
  Append ' County' to the end of a string, if not already present
*/
export const addCounty = function(string, suffix = 'County') {
  let localString = string;
  if (localString.substr(-1 * suffix.length) !== suffix) {
    localString += ` ${suffix}`;
  }
  return localString;
};

/*
  Add empty regions if they're not defined already
*/
export const addEmptyRegions = function(regionDataArray, regionNameArray, regionGranularity) {
  if (regionDataArray.length === 0) {
    throw new Error(`Attempted to addEmptyRegions with without providing any ${regionGranularity} records`);
  }
  let cases = 0;
  for (const entry of regionDataArray) {
    if (entry.cases !== undefined) {
      cases += entry.cases;
    }
  }
  if (cases === 0) {
    throw new Error(`Attempted to addEmptyRegions with without providing any actual cases`);
  }

  // Get an object of all the tracked regions
  const trackedRegions = regionDataArray.reduce((a, region) => {
    a[region[regionGranularity]] = true;
    return a;
  }, {});

  for (const regionName of regionNameArray) {
    if (!trackedRegions[regionName]) {
      // Throw an empty region on if not defined
      regionDataArray.push({
        [regionGranularity]: regionName,
        cases: 0
      });
    }
  }
  return regionDataArray;
};

/*
  Calculates active cases from location data
*/
export const getActiveFromLocation = function(location) {
  if (location.cases !== undefined && location.deaths !== undefined && location.recovered !== undefined) {
    return location.cases - location.deaths - location.recovered;
  }
  return undefined;
};

/*
  Return a minimized and stripped county name with no punctuation
*/
export const stripCountyName = function(county) {
  // Strip off country/parish, all punctuation, lowercase
  return county
    .trim()
    .toLowerCase()
    .replace(/[^A-Za-z,]*/g, '')
    .replace(/(parish|county|municipality|borough)/, '');
};

/*
  Get a proper state name
*/
export const getState = function(state) {
  // drop ISO code if passed
  state = state
    .split(':')
    .pop()
    .replace(/US-/, '');
  return usStates[state] || state;
};

/*
  Get a proper county name
*/
export const getCounty = function(county, state) {
  state = getState(state);

  // Drop suffix so we get it right
  county = county.replace(' County', '').replace(' Parish', '');

  if (county.match(/city$/)) {
    // These need to be handled on a case-by-case basis
    return county;
  }

  if (county === 'Unknown') {
    // These are cases we can't place in a given county
    return UNASSIGNED;
  }

  // Compare
  const foundCounty =
    strippedCountyMap[stripCountyName(`${county},${state}`)] ||
    strippedCountyMap[stripCountyName(`${addCounty(county)},${state}`)] ||
    strippedCountyMap[stripCountyName(`${addCounty(county, 'Parish')},${state}`)];
  if (foundCounty) {
    return foundCounty.replace(/, .*$/, '');
  }
  return county;
};
