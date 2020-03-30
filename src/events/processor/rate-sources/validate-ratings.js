import * as schema from '../../../shared/lib/schema.js';

const validateRatings = async args => {
  const { sourceRatings } = args;

  for (const rating of sourceRatings) {
    const schemaErrors = schema.schemaHasErrors(rating, schema.schemas.ratingSchema, { removeAdditional: true });
    if (schemaErrors) {
      const msg = `"${rating._path}" ${schemaErrors
        .map(error => [error.dataPath, error.message].join(' '))
        .join('; ')}`;
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(`  ❌ ${msg}`);
      }
    }
  }

  if (process.env.LOG_LEVEL === 'verbose') {
    console.log('✅ Assigned ratings for %d sources', sourceRatings.length);
  }

  return args;
};

export default validateRatings;
