import crypto from 'crypto';

import fs from 'fs';
import path from 'path';
let usStates = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'lib', 'us-states.json'), 'utf8'));

let countryCodes = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'ISO-3166-Countries-with-Regional-Codes', 'slim-3', 'slim-3.json'), 'utf8'));

/*
  Override some incorrect country names
*/
let countryMap = {
  'Congo (Kinshasa)': 'Congo',
  "Cote d'Ivoire": "Côte d'Ivoire",
  'Russia': 'Russian Federation',
  'Vietnam': 'Viet Nam',
  'Korea, South': 'Korea, Republic of',
  'South Korea': 'Korea, Republic of',
  'North Korea': "Korea (Democratic People's Republic of)",
  'Brunei': 'Brunei Darussalam',
  'Reunion': 'Réunion',
  'Curacao': 'Curaçao',
  'United Kingdom': 'United Kingdom of Great Britain and Northern Ireland'
};

/*
  Convert an object keyed on county name to an array
*/
function objectToArray(object) {
  let array = [];
  for (let [county, data] of Object.entries(object)) {
    array.push(Object.assign({
      county: county
    }, data));
  }
  return array;
}

/*
  Append ' County' to the end of a string, if not already present
*/
function addCounty(string) {
  if (!string.match(/ County$/)) {
    string = string + ' County';
  }
  return string;
}

/*
  Get the full name of a location
*/
function getName(location) {
  let name = '';
  let sep = '';
  if (location.city) {
    name += location.county;
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
}

/*
  MD5 hash a given string
*/
function hash(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

/*
  Normalize the state as a 2-letter string
*/
function toUSStateAbbreviation(string) {
  return usStates[string] || string;
}

/*
  Normalize the state as a 2-letter string
*/
function toISO3166Alpha3(string) {
  string = countryMap[string] || string;
  for (let country of countryCodes) {
    if (
      country['alpha-3'] === string || 
      country['alpha-2'] === string ||
      country.name === string ||
      country.name.replace(/\s*\(.*?\)/, '') === string ||
      country.name.replace(/, Province of .*$/, '') === string ||
      country.name.replace(/, Republic of$/, '') === string
    ) {
      return country['alpha-3'];
    }
  }
  console.warn('⚠️ Could not find country code for', string);
  return string;
}

/*
  Calculates active cases from location data
 */
function getActiveFromLocation(location) {
  let cases = location["cases"] !== undefined ? location["cases"] : 0;
  let deaths = location["deaths"] !== undefined ? location["deaths"] : 0;
  let recovered = location["recovered"] !== undefined ? location["recovered"] : 0;
  return cases - deaths - recovered
}

/*
  Turn a timeseries into a date-based bit
*/
function pivotTimeseries(timeseriesData) {
  function getProps(location) {
    let newLocation = Object.assign({}, location);
    delete newLocation.dates;
    return newLocation;
  }

  // Find all dates and locations
  let locations = [];
  let allDates = [];
  for (let [locationName, location] of Object.entries(timeseriesData)) {
    for (let [date, info] of Object.entries(location.dates)) {
      if (allDates.indexOf(date) === -1) {
        allDates.push(date);
      }
    }
    let newLocation = getProps(location);
    newLocation.name = locationName;
    locations.push(newLocation);
  }

  let timeseries = {};
  // Iterate over all dates, add data
  for (let date of allDates) {
    timeseries[date] = {};

    let index = 0;
    for (let location of locations) {
      let locationData = timeseriesData[location.name];
      if (locationData.dates[date]) {
        timeseries[date][index] = locationData.dates[date];
      }
      index++;
    }
  }

  return { timeseries, locations };
}

export {
  objectToArray,
  addCounty,
  getName,
  hash,
  toUSStateAbbreviation,
  getActiveFromLocation,
  pivotTimeseries,
  toISO3166Alpha3,
};
