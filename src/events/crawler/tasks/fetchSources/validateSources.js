import * as schema from '../../lib/schema.js';

const validateSources = async args => {
  const { sources } = args;

  let invalidScraper = 0;
  for (const source of sources) {
    const errors = schema.schemaHasErrors(source, schema.schemas.scraperSchema);
    if (errors) {
      console.log(`  ❌ Scraper at path ${source._path} is invalid`);
      console.log(errors);
      invalidScraper += 1;
    }
  }

  if (invalidScraper) {
    console.log(`❌ Found ${invalidScraper} invalid scrapers`);
  } else {
    console.log(`✅ All scrapers are valid!`);
  }

  return args;
};

export default validateSources;
