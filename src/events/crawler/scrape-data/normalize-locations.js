import path from 'path';
import * as countryLevels from '../../../shared/lib/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';

const normalizeLocations = args => {
  const { locations } = args;

  // Normalize data
  for (const location of locations) {
    if (!countryLevels.getIdFromLocation(location)) {
      if (location.country === 'USA') {
        // Normalize states
        location.state = geography.toUSStateAbbreviation(location.state);
      }

      // Normalize countries
      location.country = geography.toISO3166Alpha3(location.country);
    }

    if (!location.active) {
      location.active = geography.getActiveFromLocation(location);
    }

    // Auto-detect type if not provided
    if (!location.type && path.extname(location.url).substr(1)) {
      location.type = path.extname(location.url).substr(1);
    }
  }

  return { ...args, locations };
};

export default normalizeLocations;
