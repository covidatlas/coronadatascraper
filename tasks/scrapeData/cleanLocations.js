import * as transform from '../../lib/transform.js';

/*
  Clean the passed data
*/
const cleanLocations = args => {
  const { locations } = args;

  for (const location of locations) {
    transform.removePrivate(location);
    transform.removeScraperVars(location);
  }

  return { ...args, locations };
};

export default cleanLocations;
