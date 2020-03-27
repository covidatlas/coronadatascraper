import path from 'path';
import * as geography from '../../lib/geography.js';
import * as transform from '../../lib/transform.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths', 'active'];

/*
  Returns a report if the crosscheck fails, or false if the two sets have identical data
*/
function crosscheck(a, b) {
  const crosscheckReport = {};
  let failed = false;
  for (const prop of numericalValues) {
    if (a[prop] !== b[prop]) {
      crosscheckReport[prop] = [a[prop], b[prop]];
      failed = true;
    }
  }
  return failed ? crosscheckReport : false;
}

/*
  Check if the passed stripped location object exists in the crosscheck report
*/
function existsInCrosscheckReports(location, crosscheckReportsByLocation) {
  let exists = false;
  for (const existingLocation of crosscheckReportsByLocation) {
    if (existingLocation.url === location.url) {
      exists = true;
      break;
    }
  }
  return exists;
}

function getCleanPath(scraperFilePath) {
  const scraperFolderPath = path.resolve(__dirname, '..', '..', 'scrapers');
  return path.relative(scraperFolderPath, scraperFilePath);
}

const dedupeLocations = args => {
  console.log(`⏳ De-duping locations...`);

  const { locations } = args;

  const crosscheckReports = {};
  const seenLocations = {};
  let i = locations.length;
  let deDuped = 0;
  let crossCheckFailures = 0;
  while (i-- > 0) {
    const location = locations[i];
    const locationName = geography.getName(location);
    const otherLocation = seenLocations[locationName];

    if (otherLocation) {
      // Take rating into account to break ties
      const thisPriority = geography.getPriority(location) + location.rating / 2;
      const otherPriority = geography.getPriority(otherLocation) + otherLocation.rating / 2;

      if (otherPriority === thisPriority) {
        console.log(
          '⚠️  %s: Equal priority sources choosing %s (%d) over %s (%d) arbitrarily',
          locationName,
          getCleanPath(location._path),
          thisPriority,
          getCleanPath(otherLocation._path),
          otherPriority
        );
        // Delete the other location
        locations.splice(locations.indexOf(otherLocation), 1);
        deDuped++;
      } else if (otherPriority < thisPriority) {
        // Delete the other location
        console.log(
          '✂️  %s: Using %s (%d) instead of %s (%d)',
          locationName,
          getCleanPath(location._path),
          thisPriority,
          getCleanPath(otherLocation._path),
          otherPriority
        );
        locations.splice(locations.indexOf(otherLocation), 1);
        deDuped++;
      } else {
        // Kill this location
        console.log(
          '✂️  %s: Using %s (%d) instead of %s (%d)',
          locationName,
          getCleanPath(otherLocation._path),
          otherPriority,
          getCleanPath(location._path),
          thisPriority
        );
        locations.splice(i, 1);
        deDuped++;
      }

      const crosscheckReport = crosscheck(location, otherLocation);
      if (crosscheckReport) {
        console.log(
          '  🚨  Crosscheck failed for %s: %s (%d) has different data than %s (%d)',
          locationName,
          getCleanPath(otherLocation._path),
          otherPriority,
          getCleanPath(location._path),
          thisPriority
        );

        crosscheckReports[locationName] = crosscheckReports[locationName] || [];
        const strippedLocation = transform.removePrivate({ ...location });
        if (!existsInCrosscheckReports(strippedLocation, crosscheckReports[locationName])) {
          crosscheckReports[locationName].push(strippedLocation);
        }
        const stippedOtherLocation = transform.removePrivate({ ...otherLocation });
        if (!existsInCrosscheckReports(stippedOtherLocation, crosscheckReports[locationName])) {
          crosscheckReports[locationName].push(stippedOtherLocation);
        }
        crossCheckFailures++;
      }
    }
    seenLocations[locationName] = location;
  }

  console.log('✅ De-duped %d locations and found %d crosscheck failures! ', deDuped, crossCheckFailures);

  return { ...args, deDuped, crosscheckReports };
};

export default dedupeLocations;
