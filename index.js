import scrapers from './scrapers.js';
import * as fs from './lib/fs.js';
import path from 'path';

function addLocationToData(data, location) {
  Object.assign(data, location);
  delete data.scraper;
  return data;
}

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

function addData(cases, location, result) {
  if (Array.isArray(result)) {
    for (let data of result) {
      if (isValid(data, location)) {
        cases.push(addLocationToData(data, location));
      }
    }
  }
  else {
    if (isValid(result, location)) {
      cases.push(addLocationToData(result, location));
    }
  }
}

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

async function start() {
  console.log('⏳ Scraping data...');

  let cases = await scrape();

  fs.writeFile(path.join('dist', 'data.json'), JSON.stringify(cases, null, 2));

  console.log('✅ Data scraped for %d counties', cases.length);
};

start();

