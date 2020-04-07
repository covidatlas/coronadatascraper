import * as schema from '../../../shared/lib/schema.js';
import log from '../../../shared/lib/log.js';
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
      log.error(`  ❌ ${msg}`);
    }
  }

  if (errors.length) {
    log.error(`❌ Found ${errors.length} invalid scrapers`);
  } else {
    log(`✅ All scrapers are valid!`);
  }

  report.sources = {
    numSources: sources.length,
    errors
  };

  return args;
};

export default validateSources;
