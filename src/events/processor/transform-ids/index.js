import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';
import log from '../../../shared/lib/log.js';

function compare(a, b) {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return -1;
  }
  if (!b) {
    return 1;
  }

  return a.localeCompare(b);
}

const transformIds = async ({ locations, featureCollection, report, options, sourceRatings }) => {
  log('⏳ Transforming IDs...');

  let idsFound = 0;
  for (const location of locations) {
    const clId = countryLevels.getIdFromLocation(location);
    if (clId) {
      idsFound++;
    }

    // Transform no matter what
    await countryLevels.transformLocationIds(location);

    if (!location.name) {
      // Store location name if not provided
      location.name = geography.getName(location);
    }

    // Store level
    location.level = geography.getLocationGranularityName(location);
  }
  log('✅ Found direct matches for %d out of %d locations', idsFound, Object.keys(locations).length);

  // Transform ratings
  for (const rating of sourceRatings) {
    // Transform no matter what
    await countryLevels.transformLocationIds(rating);
  }

  // Transform crosscheck reports
  const crosscheckReports = [];

  for (const [, crosscheckReport] of Object.entries(report.scrape.crosscheckReports)) {
    // Transform no matter what
    await countryLevels.transformLocationIds(crosscheckReport.location);
    crosscheckReports.push(crosscheckReport);
  }

  report.scrape.crosscheckReports = crosscheckReports.sort((a, b) => {
    return (
      compare(a.location.city, b.location.city) ||
      compare(a.location.county, b.location.county) ||
      compare(a.location.state, b.location.state) ||
      compare(a.location.country, b.location.country)
    );
  });

  report.transformIds = {
    idsResolved: idsFound
  };

  return { locations, featureCollection, report, options, sourceRatings };
};

export default transformIds;
