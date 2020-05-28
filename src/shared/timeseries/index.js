const imports = require('esm')(module);

const path = require('path');

const argv = imports('../cli/cli-args.js').default;
const fs = imports('../lib/fs.js');
const transform = imports('../lib/transform.js');
const geography = imports('../lib/geography/index.js');
const datetime = imports('../lib/datetime/index.js').default;
const runCrawler = imports('./run-crawler.js').default;

const clearAllTimeouts = imports('../utils/timeouts.js').default;

// The props to keep on a date object
const caseDataProps = [
  'cases',
  'deaths',
  'recovered',
  'active',
  'tested',
  'hospitalized',
  'hospitalized_current',
  'discharged',
  'icu',
  'icu_current',
  'growthFactor'
];

let dates;

/*
  Drop everything but case data from a location
*/
function stripInfo(location) {
  const newLocation = {};
  for (const prop of caseDataProps) {
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
  const newLocation = {};
  for (const prop in location) {
    if (!caseDataProps.includes(prop)) {
      newLocation[prop] = location[prop];
    }
  }
  return newLocation;
}

async function generateTidyCSV(timeseriesByLocation) {
  let columns = ['name', 'level', 'city', 'county', 'state', 'country', 'population', 'lat', 'long', 'aggregate', 'tz'];

  const csvData = [];
  for (const [, location] of Object.entries(timeseriesByLocation)) {
    // Build base row
    const row = [];
    for (const column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      } else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
      } else if (column === 'tz') {
        row.push(location[column] ? location[column].join(',') : null);
      } else {
        row.push(location[column]);
      }
    }

    // For each date, add rows for each type
    for (const date of dates) {
      for (const type of caseDataProps) {
        if (location.dates[date] && location.dates[date][type] !== undefined) {
          const dateTypeRow = row.slice();
          dateTypeRow.push(datetime.getYYYYMMDD(new Date(date)));
          dateTypeRow.push(type);
          dateTypeRow.push(location.dates[date][type]);
          csvData.push(dateTypeRow);
        }
      }
    }
  }

  columns = columns.concat(['date', 'type', 'value']);

  csvData.splice(0, 0, columns);

  return csvData;
}

async function generateCSV(timeseriesByLocation) {
  let columns = [
    'name',
    'level',
    'city',
    'county',
    'state',
    'country',
    'population',
    'lat',
    'long',
    'url',
    'aggregate',
    'tz'
  ];

  const csvData = [];
  for (const [, location] of Object.entries(timeseriesByLocation)) {
    // Build base row
    const row = [];
    for (const column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      } else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
      } else if (column === 'tz') {
        row.push(location[column] ? location[column].join(',') : null);
      } else {
        row.push(location[column]);
      }
    }

    // For each date, add a row
    for (const date of dates) {
      const dateRow = row.slice();
      let hasData = false;
      for (const type of caseDataProps) {
        if (location.dates[date] && location.dates[date][type]) {
          hasData = true;
        }
        dateRow.push((location.dates[date] && location.dates[date][type]) || '');
      }
      if (hasData) {
        dateRow.push(datetime.getYYYYMMDD(new Date(date)));
        csvData.push(dateRow);
      }
    }
  }

  columns = columns.concat(caseDataProps).concat(['date']);

  csvData.splice(0, 0, columns);

  return csvData;
}

async function generateJHUCSV(timeseriesByLocation) {
  let columns = [
    'name',
    'level',
    'city',
    'county',
    'state',
    'country',
    'lat',
    'long',
    'population',
    'url',
    'aggregate',
    'tz'
  ];

  const csvData = [];
  for (const [, location] of Object.entries(timeseriesByLocation)) {
    const row = [];
    for (const column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      } else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
      } else if (column === 'tz') {
        row.push(location[column] ? location[column].join(',') : null);
      } else {
        row.push(location[column]);
      }
    }

    for (const date of dates) {
      row.push(location.dates[date] ? location.dates[date].cases : '');
    }

    csvData.push(row);
  }

  columns = columns.concat(dates);
  csvData.splice(0, 0, columns);

  return csvData;
}

function getGrowthfactor(casesToday, casesYesterday) {
  if (casesYesterday) {
    const growthFactor = casesToday / casesYesterday;
    if (growthFactor === Infinity) {
      return null;
    }
    return growthFactor;
  }
  return null;
}

/*
  Generate timeseries data
*/
async function generateTimeseries(options = {}) {
  // Generate a list of dates starting at the first date, OR the provided start date
  // ending at today or the provided end date
  dates = [];
  const today = new Date();
  const endDate = options.endDate ? new Date(options.endDate) : today;
  let curDate = new Date('2020-1-22');
  if (options.date) {
    curDate = new Date(options.date);
  }
  while (curDate <= endDate) {
    dates.push(datetime.getYYYYMMDD(curDate));
    curDate.setDate(curDate.getDate() + 1);
  }

  const timeseriesByLocation = {};
  let previousDate = null;
  const lastDate = dates[dates.length - 1];
  let featureCollection;
  for (const date of dates) {
    const data = await runCrawler({
      ...options,
      date: date === today ? undefined : date,
      findFeatures: date === lastDate,
      findPopulations: date === lastDate,
      writeData: false
    });

    if (date === lastDate) {
      featureCollection = data.featureCollection;
    }

    for (const location of data.locations) {
      const name = geography.getName(location);

      const existingDates = timeseriesByLocation[name] && timeseriesByLocation[name].dates;
      timeseriesByLocation[name] = { dates: existingDates || {}, ...stripCases(location) };

      const strippedLocation = stripInfo(location);

      // Add growth factor
      if (previousDate && timeseriesByLocation[name].dates[previousDate]) {
        const growthFactor = getGrowthfactor(
          strippedLocation.cases,
          timeseriesByLocation[name].dates[previousDate].cases
        );
        if (growthFactor !== null) {
          const rounded = Math.round((growthFactor + Number.EPSILON) * 100) / 100;
          strippedLocation.growthFactor = rounded;
        }
      }

      timeseriesByLocation[name].dates[date] = strippedLocation;
    }

    previousDate = date;
  }

  const d = options.writeTo;
  await fs.ensureDir(d);

  await fs.writeJSON(path.join(d, 'timeseries-byLocation.json'), timeseriesByLocation, { space: 0 });
  await fs.writeJSON(path.join(d, 'features.json'), featureCollection, { space: 0 });

  const { locations, timeseriesByDate } = transform.transposeTimeseries(timeseriesByLocation);
  await fs.writeJSON(path.join(d, `timeseries.json`), timeseriesByDate, { space: 2 });
  await fs.writeJSON(path.join(d, `locations.json`), locations, { space: 2 });

  let csvData = null;
  csvData = await generateCSV(timeseriesByLocation);
  await fs.writeCSV(path.join(d, 'timeseries.csv'), csvData);

  csvData = await generateTidyCSV(timeseriesByLocation);
  await fs.writeCSV(path.join(d, 'timeseries-tidy.csv'), csvData);

  csvData = await generateJHUCSV(timeseriesByLocation);
  await fs.writeCSV(path.join(d, 'timeseries-jhu.csv'), csvData);
}

generateTimeseries(argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
