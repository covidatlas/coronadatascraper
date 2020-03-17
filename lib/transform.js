import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as datetime from './datetime.js';

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
  'Congo (Brazzaville)': 'COG'
};

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
  for (const country of countryCodes) {
    if (country['alpha-3'] === string || country['alpha-2'] === string || country.name === string || country.name.replace(/\s*\(.*?\)/, '') === string || country.name.replace(/, Province of .*$/, '') === string || country.name.replace(/, Republic of$/, '') === string) {
      return country['alpha-3'];
    }
  }
  console.warn('⚠️  Could not find country code for', string);
  return string;
}

/*
  Calculates active cases from location data
 */
function getActiveFromLocation(location) {
  const cases = location.cases !== undefined ? location.cases : 0;
  const deaths = location.deaths !== undefined ? location.deaths : 0;
  const recovered = location.recovered !== undefined ? location.recovered : 0;
  return cases - deaths - recovered;
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
  Get the priority of a location
*/
function getPriority(location) {
  return location.priority !== undefined ? location.priority : 0;
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
  Calculate the rating of a source
    info.granularity - the granularity of the data
    info.type - the way the source presents data (see below)
    info.timeseries - true if timeseries provided, false if just latest
    info.fields -  array of fields available from source
*/
function calculateRating(info) {
  const easeOfRead = {
    json: 1,
    csv: 1,
    table: 0.75,
    list: 0.5,
    paragraph: 0.25,
    pdf: 0,
    image: -1
  };

  const timeseries = {
    false: 0, // everyone's got the latest
    true: 1 // but timeseries is worth a lot
  };

  const completeness = {
    cases: 0.5,
    tested: 1,
    deaths: 1,
    recovered: 1,
    country: 0.5,
    state: 0.5,
    county: 1,
    city: 0.5
  };

  // Give credit for completeness
  let rating = 0;
  for (const field in completeness) {
    if (info[field] !== null && info[field] !== undefined) {
      rating += completeness[field];
    }
  }

  // Auto-detect JSON and CSV
  if (!info.type && easeOfRead[path.extname(info.url).substr(1)]) {
    info.type = path.extname(info.url).substr(1);
  }

  if (info.url.substr(0, 5) === 'https' && info.ssl !== false) {
    rating += 0.25;
  }

  // Dock some points if we have to go headless
  if (info.headless) {
    rating -= 0.5;
  }

  // Assume it's a list
  rating += easeOfRead[info.type || 'list'];

  rating += timeseries[!!info.timeseries];

  // Calculate highest possible rating
  const possible =
    Object.values(completeness).reduce((a, v) => a + v, 0) +
    timeseries.true +
    Object.values(easeOfRead)
      .sort()
      .pop();

  return rating / possible;
}

export { objectToArray, addCounty, getName, hash, toUSStateAbbreviation, getActiveFromLocation, transposeTimeseries, toISO3166Alpha3, sumData, usStates, getPriority, getGrowthfactor, calculateRating };
