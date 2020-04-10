import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import fipsCodes from 'country-levels/fips.json';
// eslint-disable-next-line import/no-extraneous-dependencies
import iso2Codes from 'country-levels/iso2.json';
import { isId } from '../../../shared/lib/geography/country-levels.js';
import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';

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
  log('⏳ Normalizing locations...');

  const { locations } = args;

  // Normalize data
  for (const location of locations) {
    // make sure location.country is always in country-level id form
    if (!isId(location.country)) {
      log.error(`  ❌ location.country not in country-level id: ${location.country}, ${location._path}`);
    }

    if (!countryLevels.getIdFromLocation(location)) {
      if (location.country === 'iso1:US') {
        // Normalize states
        location.state = geography.toUSStateAbbreviation(location.state);

        if (location.county && location.county !== UNASSIGNED) {
          // Find county FIPS ID
          if (Array.isArray(location.county)) {
            const aggregatedCounty = [];
            let fipsFound = true;
            for (const subCounty of location.county) {
              const subLocation = {
                county: subCounty,
                state: location.state,
                country: location.country
              };
              const countryLevelId = findCountryLevelID(subLocation);
              if (countryLevelId) {
                aggregatedCounty.push(countryLevelId);
              } else {
                fipsFound = false;
                log.error(
                  '  ❌ Failed to find FIPS code for subset of combined region %s, %s',
                  subLocation.county,
                  subLocation.state
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
              log.error('  ❌ Failed to find FIPS code for %s, %s', location.county, location.state);
            }
          }
        }

        // Find state ID
        if (location.state) {
          if (iso2Codes[`US-${location.state}`]) {
            location.state = iso2Codes[`US-${location.state}`].countrylevel_id;
          } else {
            log.error('  ❌ Failed to find FIPS code for state %s', location.state);
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
