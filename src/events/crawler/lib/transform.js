import crypto from 'crypto';
import * as datetime from './datetime.js';

/*
  Remove "private" object properties
*/
export const removePrivate = data => {
  for (const [prop, value] of Object.entries(data)) {
    if (value === '' || prop[0] === '_') {
      delete data[prop];
    }
  }

  return data;
};
/*
  Convert an object keyed on county name to an array
*/
export const objectToArray = function(object) {
  const array = [];
  for (const [county, data] of Object.entries(object)) {
    array.push({
      county,
      ...data
    });
  }
  return array;
};

/*
  MD5 hash a given string
*/
export const hash = function(string) {
  return crypto
    .createHash('md5')
    .update(string)
    .digest('hex');
};

/*
  Turn a timeseries into a date-based bit
*/
export const transposeTimeseries = function(timeseriesByLocation) {
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
};

const caseFields = ['cases', 'recovered', 'active', 'deaths', 'tested'];

/*
  Sum the passed array of data into a single object with the properties of the optional, second argument
*/
export const sumData = function(dataArray, object) {
  const summedData = { ...object };
  for (const data of dataArray) {
    for (const field of caseFields) {
      if (data[field]) {
        summedData[field] = summedData[field] || 0;
        summedData[field] += data[field];
      }
    }
  }

  // Automatically elevate the priority
  if (summedData.priority < 1) {
    summedData.priority = 1;
  }

  return summedData;
};

/*
  Get the growth factor for two numbers, null if infinite
*/
export const getGrowthfactor = function(casesToday, casesYesterday) {
  const growthFactor = casesToday / casesYesterday;
  if (growthFactor === Infinity) {
    return null;
  }
  return growthFactor;
};

/*
  Titlecase a string, badly
*/
export const toTitleCase = function(string) {
  return string
    .split(' ')
    .map(part => part.substr(0, 1).toUpperCase() + part.substr(1).toLowerCase())
    .join(' ');
};
