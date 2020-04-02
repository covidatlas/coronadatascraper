import path from 'path';
import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';
// eslint-disable-next-line
import fipsCodes from 'country-levels/fips.json';
// eslint-disable-next-line
import iso2Codes from 'country-levels/iso2.json';
import log from '../../../shared/lib/log.js';

const UNASSIGNED = '(unassigned)';

function findCountryLevelID(location) {
  for (const [, properties] of Object.entries(fipsCodes)) {
    if (properties.state_code_postal === location.state && properties.name === location.county) {
      return properties.countrylevel_id;
    }
  }
  return null;
}

const normalizeLocations = args => {
  const { locations } = args;

  // Normalize data
  for (const location of locations) {
    if (!countryLevels.getIdFromLocation(location)) {
      // Normalize countries
      location.country = geography.toISO3166Alpha3(location.country);

      if (location.country === 'USA') {
        // Set country FIPS
        location.country = 'iso1:US';

        // Normalize states
        location.state = geography.toUSStateAbbreviation(location.state);

        if (location.county && location.county !== UNASSIGNED) {
          // Find county ID
          if (location.feature && location.feature._aggregatedLocations) {
            const aggregatedCounty = [];
            let fipsFound = true;
            for (const aggregatedLocation of location.feature._aggregatedLocations) {
              const countryLevelId = findCountryLevelID(aggregatedLocation);
              if (countryLevelId) {
                aggregatedCounty.push(countryLevelId);
              } else {
                fipsFound = false;
                log.error(
                  '❌ Failed to find FIPS code for subset of combined region %s, %s',
                  aggregatedLocation.county,
                  aggregatedLocation.state
                );
              }
            }
            if (fipsFound) {
              location.county = aggregatedCounty.join('+');
            }
          } else {
            let fipsFound = false;
            const countryLevelId = findCountryLevelID(location);
            if (countryLevelId) {
              fipsFound = true;
              location.county = countryLevelId;
            }
            if (!fipsFound) {
              log.error('❌ Failed to find FIPS code for %s, %s', location.county, location.state);
            }
          }
        }

        // Find state ID
        if (location.state) {
          if (iso2Codes[`US-${location.state}`]) {
            location.state = iso2Codes[`US-${location.state}`].countrylevel_id;
          } else {
            log.error('❌ Failed to find FIPS code for state %s', location.state);
          }
        }
      }
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
