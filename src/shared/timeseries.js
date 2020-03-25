const imports = require('esm')(module);

const path = require('path');

const generate = imports('./tasks/index.js').default;
const argv = imports('./lib/cliArgs.js').default;
const fs = imports('./lib/fs.js');
const transform = imports('./lib/transform.js');
const geography = imports('./lib/geography.js');
const datetime = imports('./lib/datetime.js');

const clearAllTimeouts = imports('./utils/timeouts.js').default;

// The props to keep on a date object
const caseDataProps = ['cases', 'deaths', 'recovered', 'active', 'tested', 'growthFactor'];

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
    if (caseDataProps.indexOf(prop) === -1) {
      newLocation[prop] = location[prop];
    }
  }
  return newLocation;
}

async function generateTidyCSV(timeseriesByLocation) {
  let columns = ['city', 'county', 'state', 'country', 'population', 'lat', 'long', 'url'];

  const csvData = [];
  for (const [, location] of Object.entries(timeseriesByLocation)) {
    // Build base row
    const row = [];
    for (const column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      } else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
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

  return fs.writeCSV(path.join('dist', 'timeseries-tidy.csv'), csvData);
}

async function generateCSV(timeseriesByLocation) {
  let columns = ['city', 'county', 'state', 'country', 'population', 'lat', 'long', 'url'];

  const csvData = [];
  for (const [, location] of Object.entries(timeseriesByLocation)) {
    // Build base row
    const row = [];
    for (const column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      } else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
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

  return fs.writeCSV(path.join('dist', 'timeseries.csv'), csvData);
}

async function generateJHUCSV(timeseriesByLocation) {
  let columns = ['city', 'county', 'state', 'country', 'lat', 'long', 'population', 'url'];

  const csvData = [];
  for (const [, location] of Object.entries(timeseriesByLocation)) {
    const row = [];
    for (const column of columns) {
      if (column === 'lat') {
        row.push(location.coordinates ? location.coordinates[1] : '');
      } else if (column === 'long') {
        row.push(location.coordinates ? location.coordinates[0] : '');
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

  return fs.writeCSV(path.join('dist', 'timeseries-jhu.csv'), csvData);
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
    dates.push(datetime.getYYYYMD(curDate));
    curDate.setDate(curDate.getDate() + 1);
  }

  const timeseriesByLocation = {};
  let previousDate = null;
  const lastDate = dates[dates.length - 1];
  let featureCollection;
  for (const date of dates) {
    const data = await generate(date === today ? undefined : date, {
      findFeatures: date === lastDate,
      findPopulations: date === lastDate,
      writeData: false,
      ...options
    });

    if (date === lastDate) {
      featureCollection = data.featureCollection;
    }

    for (const location of data.locations) {
      const name = geography.getName(location);

      timeseriesByLocation[name] = { dates: {}, ...timeseriesByLocation[name], ...stripCases(location) };

      const strippedLocation = stripInfo(location);

      // Add growth factor
      if (previousDate && timeseriesByLocation[name].dates[previousDate]) {
        strippedLocation.growthFactor = getGrowthfactor(
          strippedLocation.cases,
          timeseriesByLocation[name].dates[previousDate].cases
        );
      }

      timeseriesByLocation[name].dates[date] = strippedLocation;
    }

    previousDate = date;
  }

  await fs.writeJSON(path.join('dist', 'timeseries-byLocation.json'), timeseriesByLocation);
  await fs.writeJSON(path.join('dist', 'features.json'), featureCollection);

  const { locations, timeseriesByDate } = transform.transposeTimeseries(timeseriesByLocation);
  await fs.writeFile(path.join('dist', `timeseries.json`), JSON.stringify(timeseriesByDate, null, 2));
  await fs.writeFile(path.join('dist', `locations.json`), JSON.stringify(locations, null, 2));

  await generateCSV(timeseriesByLocation);

  await generateTidyCSV(timeseriesByLocation);

  await generateJHUCSV(timeseriesByLocation);
}

generateTimeseries(argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
