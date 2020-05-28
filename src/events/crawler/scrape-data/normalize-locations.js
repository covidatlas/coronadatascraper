// eslint-disable-next-line import/no-extraneous-dependencies
import fipsCodes from 'country-levels/fips.json';
import path from 'path';
import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import { isId } from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';

import log from '../../../shared/lib/log.js';

const UNASSIGNED = '(unassigned)';

function findCountryLevelID(location) {
  for (const [, properties] of Object.entries(fipsCodes)) {
    if (`iso2:${properties.state_code_iso}` === location.state && properties.name === location.county) {
      return properties.countrylevel_id;
    }
  }
  return null;
}

const normalizeLocations = args => {
  log('⏳ Normalizing locations...');

  const { locations } = args;
  const filteredLocations = [];

  // Normalize data
  for (const location of locations) {
    // make sure location.country and state is always in country-level id form
    if (!isId(location.country)) {
      log.error(`  ❌ location.country is not a country-level id: ${location.country}, ${location._path}`);
      continue;
    }

    if (location.state && !isId(location.state)) {
      log.error(`  ❌ location.state is not a country-level id: ${location.state}, ${location._path}`);
      continue;
    }

    if (!countryLevels.getIdFromLocation(location)) {
      if (location.country === 'iso1:US') {
        if (location.county === UNASSIGNED) {
          continue;
        }

        if (location.county) {
          // Find county FIPS ID
          if (Array.isArray(location.county)) {
            const aggregatedCounty = [];
            let fipsFound = true;
            for (const subCounty of location.county) {
              const subLocation = {
                county: subCounty,
                state: location.state
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
            } else {
              continue;
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
              continue;
            }
          }
        }
      } else {
        log.error(`  ❌ location.county is not a country-level id: ${location.state}, ${location._path}`);
        continue;
      }
    }

    if (location.active === undefined) {
      location.active = geography.getActiveFromLocation(location);
    }

    if (location.hospitalized_current === undefined) {
      location.hospitalized_current = geography.getHospitalizedCurrentFromLocation(location);
    }

    // Auto-detect type if not provided
    if (!location.type && path.extname(location.url).substr(1)) {
      location.type = path.extname(location.url).substr(1);
    }

    filteredLocations.push(location);
  }

  return { ...args, locations: filteredLocations };
};

export default normalizeLocations;
