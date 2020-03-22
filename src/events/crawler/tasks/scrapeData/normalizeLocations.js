import * as geography from '../../lib/geography.js';

const normalizeLocations = args => {
  const { locations } = args;

  // Normalize data
  for (const location of locations) {
    // Normalize states
    if (location.country === 'USA') {
      location.state = geography.toUSStateAbbreviation(location.state);
    }

    // Normalize countries
    location.country = geography.toISO3166Alpha3(location.country);

    if (!location.active) {
      location.active = geography.getActiveFromLocation(location);
    }
  }

  return { ...args, locations };
};

export default normalizeLocations;
