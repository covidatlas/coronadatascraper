import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as datetime from './datetime.js';

let usStates = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'lib', 'us-states.json'), 'utf8'));

let countryCodes = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'ISO-3166-Countries-with-Regional-Codes', 'slim-3', 'slim-3.json'), 'utf8'));

/*
  Override some incorrect country names
*/
let countryMap = {
  'Kosovo': 'KOS',
  'Congo (Kinshasa)': 'Congo, Democratic Republic of the',
  "Cote d'Ivoire": "Côte d'Ivoire",
  'Russia': 'Russian Federation',
  'Vietnam': 'Viet Nam',
  'Korea, South': 'Korea, Republic of',
  'South Korea': 'Korea, Republic of',
  'North Korea': "Korea (Democratic People's Republic of)",
  'Brunei': 'Brunei Darussalam',
  'Reunion': 'Réunion',
  'Curacao': 'Curaçao',
  'United Kingdom': 'GBR',
  'occupied Palestinian territory': 'PSR',
  'Congo (Brazzaville)': 'COG'
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
  console.warn('  ⚠️  Could not find country code for', string);
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
function transposeTimeseries(timeseriesByLocation) {
  function getProps(location) {
    let newLocation = Object.assign({}, location);
    delete newLocation.dates;
    return newLocation;
  }

  // Find all dates and locations
  let locations = [];
  let allDates = [];
  for (let [locationName, location] of Object.entries(timeseriesByLocation)) {
    for (let [date, info] of Object.entries(location.dates)) {
      if (allDates.indexOf(date) === -1) {
        allDates.push(date);
      }
    }
    let newLocation = getProps(location);
    newLocation.name = locationName;
    locations.push(newLocation);
  }

  // Sort dates
  allDates = allDates.sort((a, b) => {
    if (a === b) {
      return 0
    }

    if (datetime.dateIsBefore(a, b)) {
      return -1;
    }
    else {
      return 1;
    }
  });

  let timeseriesByDate = {};
  // Iterate over all dates, add data
  for (let date of allDates) {
    timeseriesByDate[date] = {};

    let index = 0;
    for (let location of locations) {
      let locationData = timeseriesByLocation[location.name];
      if (locationData.dates[date]) {
        timeseriesByDate[date][index] = locationData.dates[date];
      }
      index++;
    }
  }

  return { timeseriesByDate, locations };
}

let caseFields = [
  'cases',
  'recovered',
  'active',
  'deaths',
  'tested'
];

/*
  Sum the passed array of data into a single object with the properties of the optional, second argument
*/
function sumData(dataArray, object) {
  let summedData = Object.assign({}, object);
  for (let data of dataArray) {
    for (let field of caseFields) {
      if (data[field]) {
        summedData[field] = summedData[field] || 0;
        summedData[field] += data[field];
      }
    }
  }
  return summedData;
}

/*
  Get the priority of a location
*/
function getPriority(location) {
  return location._priority !== undefined ? location._priority : 0;
}

/*
  Get the growth factor for two numbers, null if infinite
*/
function getGrowthfactor(casesToday, casesYesterday) {
  let growthFactor = casesToday / casesYesterday;
  if (growthFactor === Infinity) {
    return null;
  }
  return growthFactor;
}

export {
  objectToArray,
  addCounty,
  getName,
  hash,
  toUSStateAbbreviation,
  getActiveFromLocation,
  transposeTimeseries,
  toISO3166Alpha3,
  sumData,
  usStates,
  getPriority,
  getGrowthfactor,
};
