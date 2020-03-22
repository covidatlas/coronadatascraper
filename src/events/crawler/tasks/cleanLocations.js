import * as schema from '../lib/schema.js';
import * as geography from '../lib/geography.js';

/*
  Clean the passed data
*/
const cleanLocations = args => {
  console.log(`⏳ Validating and cleaning locations`);

  const { locations, report } = args;

  const errors = [];
  for (const location of locations) {
    const schemaErrors = schema.schemaHasErrors(location, schema.schemas.locationSchema, { removeAdditional: true });
    if (schemaErrors) {
      const msg = `${geography.getName(location)} ${schemaErrors
        .map(error => [error.dataPath, error.message].join(' '))
        .join('; ')}`;
      errors.push(msg);
      console.log(`  ❌ ${msg}`);
    }
  }

  if (errors.length) {
    console.log(`❌ Found ${errors.length} invalid locations`);
  } else {
    console.log(`✅ All locations are valid!`);
  }

  report.validate = {
    errors
  };

  return args;
};

export default cleanLocations;
