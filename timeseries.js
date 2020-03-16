import generate from './index.js';
import path from 'path';
import * as transform from './lib/transform.js';
import * as datetime from './lib/datetime.js';
import * as fs from './lib/fs.js';

// Generate a list of dates starting at the first data
let dates = [];
let today = new Date();
let curDate = new Date('2020-1-22');
while (curDate <= today) {
  dates.push(datetime.getYYYYMD(curDate));
  curDate.setDate(curDate.getDate() + 1);
}

// The props to keep on a date object
let caseDataProps = [
  'cases',
  'deaths',
  'recovered',
  'active',
  'tested',
  'growthFactor'
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

async function generateTidyCSV(timeseriesByLocation) {
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
  for (let [name, location] of Object.entries(timeseriesByLocation)) {
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
          dateTypeRow.push(datetime.getYYYYMMDD(new Date(date)));
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

async function generateLessTidyCSV(timeseriesByLocation) {
  let columns = [
    'city',
    'county',
    'state',
    'country',
    'population',
    'lat',
    'long',
    'url'
  ];

  let csvData = [];
  for (let [name, location] of Object.entries(timeseriesByLocation)) {
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

    // For each date, add a row
    for (let date of dates) {
      let dateRow = row.slice();
      let hasData = false;
      for (let type of caseDataProps) {
        if (location.dates[date] && location.dates[date][type]) {
          hasData = true;
        }
        dateRow.push(location.dates[date] && location.dates[date][type] || '');
      }
      if (hasData) {
        dateRow.push(datetime.getYYYYMMDD(new Date(date)));
        csvData.push(dateRow);
      }
    }
  }

  columns = columns.concat(caseDataProps).concat([
    'date'
  ]);

  csvData.splice(0, 0, columns);

  return fs.writeCSV(path.join('dist', 'timeseries.csv'), csvData);
}

async function generateCSV(timeseriesByLocation) {
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
  for (let [name, location] of Object.entries(timeseriesByLocation)) {
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

  return fs.writeCSV(path.join('dist', 'timeseries-jhu.csv'), csvData);
}

function getGrowthfactor(casesToday, casesYesterday) {
  let growthFactor = casesToday / casesYesterday;
  if (growthFactor === Infinity) {
    return null;
  }
  return growthFactor;
}

/*
  Generate timeseries data
*/
async function generateTimeseries() {
  let timeseriesByLocation = {};
  let previousDate = null;
  let lastDate = dates[dates.length - 1];
  let featureCollection;
  for (let date of dates) {
    let data = await generate(date === lastDate ? undefined : date, {
      findFeatures: date === lastDate,
      findPopulations: date === lastDate,
      writeData: false
    });

    if (date === lastDate) {
      featureCollection = data.featureCollection;
    }

    for (let location of data.locations) {
      let name = transform.getName(location);

      timeseriesByLocation[name] = Object.assign({ dates: {} }, timeseriesByLocation[name], stripCases(location));

      let strippedLocation = stripInfo(location);

      // Add growth factor
      if (previousDate && timeseriesByLocation[name].dates[previousDate]) {
        strippedLocation.growthFactor = getGrowthfactor(strippedLocation.cases, timeseriesByLocation[name].dates[previousDate].cases);
      }

      timeseriesByLocation[name].dates[date] = strippedLocation;
    }

    previousDate = date;
  }

  await fs.writeJSON(path.join('dist', 'timeseries-byLocation.json'), timeseriesByLocation);
  await fs.writeJSON(path.join('dist', 'features.json'), featureCollection);

  let { locations, timeseriesByDate } = transform.transposeTimeseries(timeseriesByLocation);
  await fs.writeFile(path.join('dist', `timeseries.json`), JSON.stringify(timeseriesByDate, null, 2));
  await fs.writeFile(path.join('dist', `locations.json`), JSON.stringify(locations, null, 2));

  await generateCSV(timeseriesByLocation);

  await generateTidyCSV(timeseriesByLocation);

  await generateLessTidyCSV(timeseriesByLocation);
}

generateTimeseries();
