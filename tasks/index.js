import fetchScrapers from './fetchScrapers.js';
import scrapeData from './scrapeData.js';
import findFeatures from './findFeatures.js';
import findPopulations from './findPopulations.js';
import writeData from './writeData.js';

async function generate(date, options = { findFeatures: true, findPopulations: true, writeData: true, skip: null, location: null }) {
  if (date) {
    process.env.SCRAPE_DATE = date;
  } else {
    delete process.env.SCRAPE_DATE;
  }

  // JSON used for reporting
  const report = {
    date
  };

  const output = await fetchScrapers({ report, options })
    .then(scrapeData)
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findPopulations !== false && findPopulations)
    .then(options.writeData !== false && writeData);

  return output;
}

export default generate;
