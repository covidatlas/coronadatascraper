import fs from 'fs';
import path from 'path';

const usStates = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'lib', 'us-states.json'), 'utf8'));

const countryCodes = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'ISO-3166-Countries-with-Regional-Codes', 'slim-3', 'slim-3.json'), 'utf8'));

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

/**
  Normalize the state as a 2-letter string
*/
const toUSStateAbbreviation = str => {
  return usStates[str] || str;
};

/*
  Normalize the state as a 2-letter string
*/
const toISO3166Alpha3 = string => {
  string = countryMap[string] || string;
  for (const country of countryCodes) {
    if (country['alpha-3'] === string || country['alpha-2'] === string || country.name === string || country.name.replace(/\s*\(.*?\)/, '') === string || country.name.replace(/, Province of .*$/, '') === string || country.name.replace(/, Republic of$/, '') === string) {
      return country['alpha-3'];
    }
  }
  console.warn('⚠️  Could not find country code for', string);
  return string;
};

/*
  Calculates active cases from location data
 */
const getActiveFromLocation = location => {
  const cases = location.cases !== undefined ? location.cases : 0;
  const deaths = location.deaths !== undefined ? location.deaths : 0;
  const recovered = location.recovered !== undefined ? location.recovered : 0;
  return cases - deaths - recovered;
};

const normalizeLocations = args => {
  const { locations } = args;

  // Normalize data
  for (const location of locations) {
    // Normalize states
    if (location.country === 'USA') {
      location.state = toUSStateAbbreviation(location.state);
    }

    // Normalize countries
    location.country = toISO3166Alpha3(location.country);

    if (!location.active) {
      location.active = getActiveFromLocation(location);
    }
  }

  return { ...args, locations };
};

export default normalizeLocations;
