import * as turf from '@turf/turf';
import usStates from '../../../../coronavirus-data-sources/lib/us-states.json';

import countryCodes from '../../../../coronavirus-data-sources/ISO-3166-Countries-with-Regional-Codes/slim-3/slim-3.json';
import countyGeoJSON from '../../../../coronavirus-data-sources/geojson/usa-counties.json';

export { usStates };

/*
  Override some incorrect country names
*/
const countryMap = {
  Kosovo: 'XKX',
  'Congo (Kinshasa)': 'Congo, Democratic Republic of the',
  "Cote d'Ivoire": "Côte d'Ivoire",
  Russia: 'Russian Federation',
  Vietnam: 'Viet Nam',
  'Korea, South': 'Korea, Republic of',
  'South Korea': 'Korea, Republic of',
  'North Korea': "Korea (Democratic People's Republic of)",
  Brunei: 'Brunei Darussalam',
  Reunion: 'Réunion',
  Curacao: 'Curaçao',
  'United Kingdom': 'GBR',
  'occupied Palestinian territory': 'PSE',
  'Congo (Brazzaville)': 'COG',
  Tanzania: 'TZA',
  'The Bahamas': 'BHS',
  'Gambia, The': 'GMB'
};

/*
  Given a list of counties and a set of properties, combine the GeoJSON for the counties and slap the properties on it
*/
export function generateMultiCountyFeature(counties, properties) {
  // Collect a list of features and polygons matching the list of counties
  const polygons = [];
  const features = [];
  for (const countyFeature of countyGeoJSON.features) {
    if (counties.indexOf(countyFeature.properties.name) !== -1) {
      features.push(countyFeature.properties.name);
      polygons.push(turf.feature(countyFeature.geometry));
    }
  }

  // Generate a combined feature from all of the polygons
  let combinedPolygon = polygons.pop();
  while (polygons.length) {
    combinedPolygon = turf.union(combinedPolygon, polygons.pop());
  }
  const combinedFeature = combinedPolygon;
  combinedFeature.properties = properties;

  // Store each of the locations so we can reference them later and get populatin data
  combinedFeature._aggregatedLocations = features.map(f => {
    const [county, state] = f.split(', ');
    return {
      county,
      state,
      ...properties
    };
  });

  return combinedFeature;
}

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

/*
  Get the full name of a location
*/
export const getName = function(location) {
  let name = '';
  let sep = '';
  if (location.city) {
    name += location.city;
    sep = ', ';
  }
  if (location.county) {
    name += sep + location.county;
    sep = ', ';
  }
  if (location.state) {
    name += sep + location.state;
    sep = ', ';
  }
  if (location.country) {
    name += sep + location.country;
    sep = ', ';
  }
  return name;
};

/*
  Get the priority of a location
*/
export const getPriority = function(location) {
  return location.priority !== undefined ? location.priority : 0;
};

/*
  Normalize the state as a 2-letter string
*/
export const toUSStateAbbreviation = function(string) {
  return usStates[string] || string;
};

/*
  Normalize the state as a 2-letter string
*/
export const toISO3166Alpha3 = function(string) {
  let localString = string;
  localString = countryMap[localString] || localString;
  for (const country of countryCodes) {
    if (
      country['alpha-3'] === localString ||
      country['alpha-2'] === localString ||
      country.name === localString ||
      country.name.replace(/\s*\(.*?\)/, '') === localString ||
      country.name.replace(/, Province of .*$/, '') === localString ||
      country.name.replace(/, Republic of$/, '') === localString
    ) {
      return country['alpha-3'];
    }
  }
  console.warn('⚠️  Could not find country code for', localString);
  return localString;
};

/*
  Append ' County' to the end of a string, if not already present
*/
export const addCounty = function(string) {
  let localString = string;
  if (!localString.match(/ County$/)) {
    localString += ' County';
  }
  return localString;
};

/*
  Add empty regions if they're not defined already
*/
export const addEmptyRegions = function(regionDataArray, regionNameArray, regionGranularity) {
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
  const cases = location.cases !== undefined ? location.cases : 0;
  const deaths = location.deaths !== undefined ? location.deaths : 0;
  const recovered = location.recovered !== undefined ? location.recovered : 0;
  return cases - deaths - recovered;
};
