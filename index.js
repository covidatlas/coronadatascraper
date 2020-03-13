import scrapers from './scrapers.js';

async function executeScraper(location) {
  let data = await location.scraper();
  Object.assign(data, location);

  delete data.scraper;

  return data;
}

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
      addData(cases, location, await executeScraper(location));
    }
  }

  console.log(cases);
  return cases;
}

scrape();

