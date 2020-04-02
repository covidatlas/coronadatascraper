import path from 'path';
import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';
import fipsCodes from 'country-levels/fips.json';
import log from '../../../shared/lib/log.js';

function findCountryLevelID(location) {
  let fips = null;
  for (let [fipsCode, properties] of Object.entries(fipsCodes)) {
    if (properties.state_code_postal === location.state && properties.name === location.county) {
      return properties.countrylevel_id;
    }
  }
}

const normalizeLocations = args => {
  const { locations } = args;

  // Normalize data
  for (const location of locations) {
    if (!countryLevels.getIdFromLocation(location)) {
      if (location.country === 'USA') {
        // Normalize states
        location.state = geography.toUSStateAbbreviation(location.state);

        if (location.county) {
          // Find in fips
          if (location.feature && location.feature._aggregatedLocations) {
            let aggregatedCounty = [];
            let fipsFound = true;
            for (let aggregatedLocation of location.feature._aggregatedLocations) {
              let countryLevelId = findCountryLevelID(aggregatedLocation);
              if (countryLevelId) {
                aggregatedCounty.push(countryLevelId);
              }
              else {
                fipsFound = false;
                log.error('❌ Failed to find FIPS code for subset of combined region %s, %s', aggregatedLocation.county, aggregatedLocation.state);
              }
            }
            if (fipsFound) {
              // I have no idea if this is useful at all, but it sort of matches what we discussed
              location.countyId = aggregatedCounty.join('+');
            }
          }
          else {
            let fipsFound = false;
            let countryLevelId = findCountryLevelID(location);
            if (countryLevelId) {
              fipsFound = true;
            }
            if (!fipsFound) {
              log.error('❌ Failed to find FIPS code for %s, %s', location.county, location.state);
            }
          }
        }
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
