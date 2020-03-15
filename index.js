import path from 'path';
import scrapers from './scrapers.js';
import * as fs from './lib/fs.js';
import * as transform from './lib/transform.js';
import * as stringify from './lib/stringify.js';

import findFeatures from './tasks/findFeatures.js';
import findPopulations from './tasks/findPopulations.js';

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
  // Normalize states
  if (data.country === 'USA') {
    data.state = transform.toUSStateAbbreviation(data.state);
  }

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
    if (result.length === 0) {
      throw new Error(`Invalid data: scraper for ${transform.getName(location)} returned 0 rows`);
    }
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
        console.error('  ❌ Error processing %s: ', transform.getName(location), err);
      }
    }
  }

  return cases;
}

/*
  Main
*/
async function scrapeData() {
  console.log(`⏳ Scraping data for ${process.env['SCRAPE_DATE'] ? process.env['SCRAPE_DATE'] : 'today'}...`);

  let locations = await scrape();

  let states = 0;
  let counties = 0;
  let countries = 0;
  for (let location of locations) {
    if (!location.state && !location.county) {
      countries++;
    }
    else if (!location.county) {
      states++;
    }
    else {
      counties++;
    }
    location["active"] = location["active"] === undefined ? transform.getActiveFromLocation(location) : location["active"];
  }

  console.log('✅ Data scraped!');
  console.log('   - %d countries', countries);
  console.log('   - %d states', states);
  console.log('   - %d counties', counties);

  return { locations };
};

async function writeData({ locations, featureCollection }) {
  let date = process.env['SCRAPE_DATE'] ?  '-' + process.env['SCRAPE_DATE'] : '';

  await fs.ensureDir('dist')

  await fs.writeFile(path.join('dist', `data${date}.json`), JSON.stringify(locations, null, 2));

  await fs.writeCSV(path.join('dist', `data${date}.csv`), stringify.csvForDay(locations));

  await fs.writeJSON(path.join('dist', `features${date}.json`), featureCollection);

  return { locations, featureCollection };
}

async function generate(date, options = { findFeatures: true, findPopulations: true, writeData: true }) {
  if (date) {
    process.env['SCRAPE_DATE'] = date;
  }
  else {
    delete process.env['SCRAPE_DATE'];
  }

  return scrapeData()
    .then(options.findFeatures && findFeatures)
    .then(options.findPopulations && findPopulations)
    .then(options.writeData && writeData);
}

export default generate;
