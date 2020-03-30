import * as schema from '../../../shared/lib/schema.js';
import log from '../../../shared/lib/log.js';
import * as geography from '../../../shared/lib/geography/index.js';
import reporter from '../../../shared/lib/error-reporter.js';

/*
  Clean the passed data
*/
const cleanLocations = args => {
  log(`⏳ Validating and cleaning locations`);

  const { locations, report } = args;

  const errors = [];
  for (const location of locations) {
    const schemaErrors = schema.schemaHasErrors(location, schema.schemas.locationSchema, { removeAdditional: true });
    if (schemaErrors) {
      const msg = `${geography.getName(location)} ${schemaErrors
        .map(error => [error.dataPath, error.message].join(' '))
        .join('; ')}`;
      errors.push(msg);
      log(`  ❌ ${msg}`);
      reporter.logError('location validation', 'invalid location object', msg, 'low', location);
    }
  }

  if (errors.length) {
    log(`❌ Found ${errors.length} invalid locations`);
  } else {
    log(`✅ All locations are valid!`);
  }

  report.validate = {
    errors
  };

  return args;
};

export default cleanLocations;
