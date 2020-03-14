import path from 'path';
import csvStringify from 'csv-stringify';
import scrapers from './scrapers.js';
import * as fs from './lib/fs.js';

import findFeatures from './tasks/findFeatures.js';

/*
  Combine location information with the passed data object
*/
function addLocationToData(data, location) {
  Object.assign(data, location);

  for (let prop in data) {
    // Remove "private" fields
    if (prop[0] === '_') {
      delete data[prop];
    }
  }

  delete data.scraper;

  return data;
}

/*
  Check if the provided data contains any invalid fields
*/
function isValid(data, location) {
  if (data.cases === undefined) {
    throw new Error(`Invalid data: contains no case data`);
  }

  for (let [prop, value] of Object.entries(data)) {
    if (value === null) {
      throw new Error(`Invalid data: ${prop} is null`);
    }
    if (Number.isNaN(value))   {
      throw new Error(`Invalid data: ${prop} is not a number`);
    }
  }

  return true;
}

/*
  Clean the passed data
*/
function clean(data) {
  for (let [prop, value] of Object.entries(data)) {
    if (value === '') {
      delete data[prop];
    }
  }

  return data;
}

/*
  Add output data to the cases array. Input can be either an object or an array
*/
function addData(cases, location, result) {
  if (Array.isArray(result)) {
    for (let data of result) {
      if (isValid(data, location)) {
        cases.push(clean(addLocationToData(data, location)));
      }
    }
  }
  else {
    if (isValid(result, location)) {
      cases.push(clean(addLocationToData(result, location)));
    }
  }
}

/*
  Begin the scraping process
*/
async function scrape() {
  let cases = [];
  for (let location of scrapers) {
    if (location.scraper) {
      try {
        addData(cases, location, await location.scraper());
      }
      catch(err) {
        console.error('  ❌ Error processing %s: ', location.county, err);
      }
    }
  }

  return cases;
}

/*
  Generate a CSV from the given data
*/
function generateCSV(data) {
  return new Promise((resolve, reject) => {
    // Start with the columns we want first
    let columns = [
      'city',
      'county',
      'state',
      'country',
      'cases',
      'deaths',
      'recovered',
      'tested',
      'lat',
      'long',
      'url'
    ];

    // Get list of columns
    for (let location of data) {
      for (let column in location) {
        if (columns.indexOf(column) === -1) {
          columns.push(column);
        }
      }
    }

    // Drop coordinates
    columns = columns.filter(column => column != 'coordinates');

    // Turn data into arrays
    let csvData = [
      columns
    ];
    for (let location of data) {
      let row = [];
      for (let column of columns) {
        // Output lat and long instead
        if (column === 'lat' && location.coordinates) {
          row.push(location.coordinates[1]);
        }
        else if (column === 'long' && location.coordinates) {
          row.push(location.coordinates[0]);
        }
        else {
          row.push(location[column]);
        }
      }
      csvData.push(row);
    }

    csvStringify(csvData, (err, output) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(output);
      }
    });
  });
}

/*
  Main
*/
async function scrapeData() {
  console.log('⏳ Scraping data...');

  let cases = await scrape();

  await fs.writeFile(path.join('dist', 'data.json'), JSON.stringify(cases, null, 2));

  let csvString = await generateCSV(cases);

  await fs.writeFile(path.join('dist', 'data.csv'), csvString);

  let states = 0;
  let counties = 0;
  let countries = 0;
  for (let location of cases) {
    if (!location.state && !location.county) {
      countries++;
    }
    else if (!location.county) {
      states++;
    }
    else {
      counties++;
    }
  }

  console.log('✅ Data scraped!');
  console.log('   - %d countries', countries);
  console.log('   - %d states', states);
  console.log('   - %d counties', counties);

  return {
    locations: cases
  };
};

scrapeData()
  .then(findFeatures);
