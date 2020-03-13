import scrapers from './scrapers.js';
import * as fs from './lib/fs.js';
import path from 'path';

function addLocationToData(data, location) {
  Object.assign(data, location);
  delete data.scraper;
  return data;
}

function addData(cases, location, result) {
  if (Array.isArray(result)) {
    for (let data of result) {
      cases.push(addLocationToData(data, location));
    }
  }
  else {
    cases.push(addLocationToData(result, location));
  }
}

async function scrape() {
  let cases = [];
  for (let location of scrapers) {
    if (location.scraper) {
      addData(cases, location, await location.scraper());
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

