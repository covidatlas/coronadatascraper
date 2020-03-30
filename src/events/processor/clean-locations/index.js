import * as schema from '../../../shared/lib/schema.js';
import * as geography from '../../../shared/lib/geography/index.js';
import reporter from '../../../shared/lib/error-reporter.js';

/*
  Clean the passed data
*/
const cleanLocations = args => {
  if (process.env.LOG_LEVEL === 'verbose') {
    console.log(`⏳ Validating and cleaning locations`);
  }

  const { locations, report } = args;

  const errors = [];
  for (const location of locations) {
    const schemaErrors = schema.schemaHasErrors(location, schema.schemas.locationSchema, { removeAdditional: true });
    if (schemaErrors) {
      const msg = `${geography.getName(location)} ${schemaErrors
        .map(error => [error.dataPath, error.message].join(' '))
        .join('; ')}`;
      errors.push(msg);
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(`  ❌ ${msg}`);
      }
      reporter.logError('location validation', 'invalid location object', msg, 'low', location);
    }
  }

  if (process.env.LOG_LEVEL === 'verbose') {
    if (errors.length) {
      console.log(`❌ Found ${errors.length} invalid locations`);
    } else {
      console.log(`✅ All locations are valid!`);
    }
  }

  report.validate = {
    errors
  };

  return args;
};

export default cleanLocations;
