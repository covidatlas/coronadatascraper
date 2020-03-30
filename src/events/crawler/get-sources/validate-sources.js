import * as schema from '../../../shared/lib/schema.js';
import reporter from '../../../shared/lib/error-reporter.js';

const validateSources = async args => {
  const { sources, report } = args;

  const errors = [];
  for (const source of sources) {
    const schemaErrors = schema.schemaHasErrors(source, schema.schemas.scraperSchema, {});
    if (schemaErrors) {
      const msg = `"${source._path}" ${schemaErrors
        .map(error => [error.dataPath, error.message].join(' '))
        .join('; ')}`;
      errors.push(msg);
      reporter.logError('source validation', 'invalid source object', msg, 'low', source);
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(`  ❌ ${msg}`);
      }
    }
  }

  if (process.env.LOG_LEVEL === 'verbose') {
    if (errors.length) {
      console.log(`❌ Found ${errors.length} invalid scrapers`);
    } else {
      console.log(`✅ All scrapers are valid!`);
    }
  }

  report.sources = {
    numSources: sources.length,
    errors
  };

  return args;
};

export default validateSources;
