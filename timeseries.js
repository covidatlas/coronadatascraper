import generate from './index.js';
import path from 'path';
import * as transform from './lib/transform.js';
import * as date from './lib/datetime.js';
import * as fs from './lib/fs.js';

// Generate a list of dates starting at the first data
let dates = [];
let today = new Date();
let curDate = new Date('2020-1-22');
while (curDate <= today) {
  dates.push(date.getYYYYMD(curDate));
  curDate.setDate(curDate.getDate() + 1);
}

// The props to keep on a date object
let caseDataProps = [
  'cases',
  'deaths',
  'recovered',
  'tested'
];

/*
  Drop everything but case data from a location
*/
function stripInfo(location) {
  let newLocation = {};
  for (let prop of caseDataProps) {
    if (location[prop] !== undefined) {
      newLocation[prop] = location[prop];
    }
  }
  return newLocation;
}

/*
  Drop case data from a location
*/
function stripCases(location) {
  let newLocation = {};
  for (let prop in location) {
    if (caseDataProps.indexOf(prop) === -1) {
      newLocation[prop] = location[prop];
    }
  }
  return newLocation;
}

async function generateTidyCSV(timeseriesData) {
  let columns = [
    'city',
    'county',
    'state',
    'country',
    'population',
    'lat',
    'long'
  ];

  let csvData = [];
  for (let [name, location] of Object.entries(timeseriesData)) {
    // Build base row
    let row = [];
    for (let column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      }
      else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
      }
      else {
        row.push(location[column]);
      }
    }

    // For each date, add rows for each type
    for (let date of dates) {
      for (let type of caseDataProps) {
        if (location.dates[date] && location.dates[date][type] !== undefined) {
          let dateTypeRow = row.slice();
          dateTypeRow.push(date);
          dateTypeRow.push(type);
          dateTypeRow.push(location.dates[date][type]);
          csvData.push(dateTypeRow);
        }
      }
    }
  }

  columns = columns.concat([
    'date',
    'type',
    'value'
  ]);

  csvData.splice(0, 0, columns);

  return fs.writeCSV(path.join('dist', 'timeseries-tidy.csv'), csvData);
}

async function generateCSV(timeseriesData) {
  let columns = [
    'city',
    'county',
    'state',
    'country',
    'lat',
    'long',
    'population',
    'type',
    'value',
    'url'
  ];

  let csvData = [];
  for (let [name, location] of Object.entries(timeseriesData)) {
    let row = [];
    for (let column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      }
      else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
      }
      else {
        row.push(location[column]);
      }
    }

    for (let date of dates) {
      row.push(location.dates[date] ? location.dates[date].cases : '');
    }

    csvData.push(row);
  }

  columns = columns.concat(dates);
  csvData.splice(0, 0, columns);

  return fs.writeCSV(path.join('dist', 'timeseries-simple.csv'), csvData);
}

/*
  Generate timeseries data
*/
async function generateTimeseries() {
  let timeseriesData = {};
  let previousDate = null;
  let lastDate = dates[dates.length - 1];
  for (let date of dates) {
    let data = await generate(date, {
      findFeatures: date === lastDate,
      findPopulations: date === lastDate,
      writeData: false
    });

    for (let location of data.locations) {
      let name = transform.getName(location);

      timeseriesData[name] = Object.assign({ dates: {} }, timeseriesData[name], stripCases(location));

      let strippedLocation = stripInfo(location);

      // Add growth factor
      if (previousDate && timeseriesData[name].dates[previousDate]) {
        strippedLocation.growthFactor = strippedLocation.cases / timeseriesData[name].dates[previousDate].cases;
      }

      timeseriesData[name].dates[date] = strippedLocation;
    }

    previousDate = date;
  }

  await fs.writeJSON(path.join('dist', 'timeseries.json'), timeseriesData);

  await generateCSV(timeseriesData);

  await generateTidyCSV(timeseriesData);
}

generateTimeseries();
