import fetchSources from './fetchSources.js';
import scrapeData from './scrapeData/index.js';
import findFeatures from './findFeatures.js';
import findPopulations from './findPopulations.js';
import writeData from './writeData.js';

async function generate(date, options) {
  if (date) {
    process.env.SCRAPE_DATE = date;
  } else {
    delete process.env.SCRAPE_DATE;
  }

  // JSON used for reporting
  const report = {
    date
  };

  const output = await fetchSources({ date, report, options })
    .then(scrapeData)
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findFeatures !== false && findPopulations)
    .then(options.writeData !== false && writeData);

  return output;
}

export default generate;
