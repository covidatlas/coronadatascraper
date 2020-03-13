import scrapers from './scrapers.js';

async function executeScraper(location) {
  let data = await location.scraper();
  Object.assign(data, location);

  delete data.scraper;

  return data;
}

async function scrape() {
  let cases = [];
  for (let location of scrapers) {
    if (location.scraper) {
      cases.push(await executeScraper(location));
    }
  }

  console.log(cases);
  return cases;
}

scrape();

