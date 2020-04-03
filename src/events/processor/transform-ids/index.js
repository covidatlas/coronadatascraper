import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';
import log from '../../../shared/lib/log.js';

const transformIds = async ({ locations, featureCollection, report, options, sourceRatings }) => {
  log('⏳ Transforming IDs...');

  let idsFound = 0;
  for (const location of locations) {
    const clId = countryLevels.getIdFromLocation(location);
    if (clId) {
      idsFound++;
      await countryLevels.transformLocationIds(location);
    }

    if (!location.name) {
      // Store location name if not provided
      location.name = geography.getName(location);
    }

    // Store level
    location.level = geography.getLocationGranularityName(location);
  }
  log('✅ Transformed IDs for %d out of %d locations', idsFound, Object.keys(locations).length);

  report.transformIds = {
    idsResolved: idsFound
  };

  return { locations, featureCollection, report, options, sourceRatings };
};

export default transformIds;
