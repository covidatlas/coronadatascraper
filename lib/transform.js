import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as datetime from './datetime.js';

const usStates = JSON.parse(fs.readFileSync(path.join('coronavirus-data-sources', 'lib', 'us-states.json'), 'utf8'));

/*
  Convert an object keyed on county name to an array
*/
function objectToArray(object) {
  const array = [];
  for (const [county, data] of Object.entries(object)) {
    array.push({
      county,
      ...data
    });
  }
  return array;
}

/*
  Append ' County' to the end of a string, if not already present
*/
function addCounty(string) {
  if (!string.match(/ County$/)) {
    string += ' County';
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
  return crypto
    .createHash('md5')
    .update(string)
    .digest('hex');
}

/*
  Turn a timeseries into a date-based bit
*/
function transposeTimeseries(timeseriesByLocation) {
  function getProps(location) {
    const newLocation = { ...location };
    delete newLocation.dates;
    return newLocation;
  }

  // Find all dates and locations
  const locations = [];
  let allDates = [];
  for (const [locationName, location] of Object.entries(timeseriesByLocation)) {
    for (const [date] of Object.entries(location.dates)) {
      if (allDates.indexOf(date) === -1) {
        allDates.push(date);
      }
    }
    const newLocation = getProps(location);
    newLocation.name = locationName;
    locations.push(newLocation);
  }

  // Sort dates
  allDates = allDates.sort((a, b) => {
    if (a === b) {
      return 0;
    }

    if (datetime.dateIsBefore(a, b)) {
      return -1;
    }
    return 1;
  });

  const timeseriesByDate = {};
  // Iterate over all dates, add data
  for (const date of allDates) {
    timeseriesByDate[date] = {};

    let index = 0;
    for (const location of locations) {
      const locationData = timeseriesByLocation[location.name];
      if (locationData.dates[date]) {
        timeseriesByDate[date][index] = locationData.dates[date];
      }
      index++;
    }
  }

  return { timeseriesByDate, locations };
}

const caseFields = ['cases', 'recovered', 'active', 'deaths', 'tested'];

/*
  Sum the passed array of data into a single object with the properties of the optional, second argument
*/
function sumData(dataArray, object) {
  const summedData = { ...object };
  for (const data of dataArray) {
    for (const field of caseFields) {
      if (data[field]) {
        summedData[field] = summedData[field] || 0;
        summedData[field] += data[field];
      }
    }
  }
  return summedData;
}

/*
  Get the growth factor for two numbers, null if infinite
*/
function getGrowthfactor(casesToday, casesYesterday) {
  const growthFactor = casesToday / casesYesterday;
  if (growthFactor === Infinity) {
    return null;
  }
  return growthFactor;
}

/*
  Add empty regions if they're not defined already
*/
function addEmptyRegions(regionDataArray, regionNameArray, regionGranularity) {
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
}

export { objectToArray, addCounty, getName, hash, transposeTimeseries, sumData, usStates, getGrowthfactor, addEmptyRegions };
