const scraperVars = ['type', 'timeseries', 'headless', 'ssl', 'priority', 'aggregate'];

/*
  Remove "private" object properties
*/
const removePrivate = location => {
  for (const [prop, value] of Object.entries(location)) {
    if (value === '') {
      delete location[prop];
    }
    // Remove "private" fields
    if (prop[0] === '_') {
      delete location[prop];
    }
  }
};

const removeScraperVars = location => {
  // Remove non-data vars
  for (const prop of scraperVars) {
    delete location[prop];
  }
};

/*
  Clean the passed data
*/
const cleanLocations = args => {
  const { locations } = args;

  for (const location of locations) {
    removePrivate(location);
    removeScraperVars(location);
  }

  return { ...args, locations };
};

export default cleanLocations;
