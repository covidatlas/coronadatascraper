import * as schema from '../lib/schema.js';

/*
  Clean the passed data
*/
const cleanLocations = args => {
  const { locations } = args;

  for (const location of locations) {
    schema.schemaHasErrors(location, schema.schemas.locationSchema);
  }

  return args;
};

export default cleanLocations;
