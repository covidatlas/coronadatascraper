import crypto from 'crypto';

import fs from 'fs';
import path from 'path';
let usStates = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'lib', 'us-states.json'), 'utf8'));

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
};
