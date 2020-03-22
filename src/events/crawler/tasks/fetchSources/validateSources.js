import * as schema from '../../lib/schema.js';

const validateSources = async args => {
  const { sources, report } = args;

  const errors = [];
  for (const source of sources) {
    const errors = schema.schemaHasErrors(source, schema.schemas.scraperSchema);
    if (errors) {
      const msg = `  ❌ "${source._path}" ${errors.map(error => [error.dataPath, error.message].join(' ')).join('; ')}`;
      errors.push(msg);
      console.log(msg);
    }
  }

  if (errors.length) {
    console.log(`❌ Found ${errors.length} invalid scrapers`);
  } else {
    console.log(`✅ All scrapers are valid!`);
  }

  report.sources = {
    numSources: sources.length,
    errors
  };

  return args;
};

export default validateSources;
