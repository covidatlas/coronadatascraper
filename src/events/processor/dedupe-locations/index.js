import path from 'path';
import * as geography from '../../../shared/lib/geography/index.js';
import * as transform from '../../../shared/lib/transform.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths'];

/*
  Returns a report if the crosscheck fails, or false if the two sets have identical data
*/
function crosscheck(a, b) {
  const crosscheckReport = {};
  let failed = false;
  for (const prop of numericalValues) {
    if ((a[prop] === 0 && b[prop] === undefined) || (b[prop] === 0 && a[prop] === undefined)) {
      // Don't complain about undefined when there should be zero, it's noise
      continue;
    }
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
  const scraperFolderPath = path.resolve(path.join('src', 'shared', 'scrapers'));
  return path.relative(scraperFolderPath, scraperFilePath);
}

const dedupeLocations = args => {
  console.log(`⏳ De-duping locations...`);

  const { locations, options } = args;

  function log(...args) {
    if (options.verbose !== undefined) {
      console.log(...args);
    }
  }

  const crosscheckReports = {};
  const seenLocations = {};
  let i = locations.length;
  let deDuped = 0;
  let crossCheckFailures = 0;
  while (i-- > 0) {
    const location = locations[i];
    const locationName = transform.normalizeString(geography.getName(location));
    const otherLocation = seenLocations[locationName];

    if (otherLocation) {
      // Take rating into account to break ties
      const thisPriority = geography.getPriority(location) + location.rating / 2;
      const otherPriority = geography.getPriority(otherLocation) + otherLocation.rating / 2;

      if (otherPriority === thisPriority) {
        log(
          '⚠️  %s: Equal priority sources choosing %s (%d) over %s (%d) arbitrarily',
          locationName,
          getCleanPath(location._path),
          thisPriority,
          getCleanPath(otherLocation._path),
          otherPriority
        );
        // Delete the other location
        const otherIndex = locations.indexOf(otherLocation);
        if (otherIndex === -1) {
          throw new Error(`Something went wrong in de-dupe, can't find index of other location`);
        }
        locations.splice(otherIndex, 1);
        seenLocations[locationName] = location; // the location we're at becomes the new seen location
        deDuped++;
      } else if (otherPriority < thisPriority) {
        // Delete the other location
        log(
          '✂️  %s: Using %s (%d) instead of %s (%d)',
          locationName,
          getCleanPath(location._path),
          thisPriority,
          getCleanPath(otherLocation._path),
          otherPriority
        );
        const otherIndex = locations.indexOf(otherLocation);
        if (otherIndex === -1) {
          throw new Error(`Something went wrong in de-dupe, can't find index of other location`);
        }
        locations.splice(otherIndex, 1);
        seenLocations[locationName] = location; // the location we're at becomes the new seen location
        deDuped++;
      } else {
        // Kill this location
        log(
          '✂️  %s: Using %s (%d) instead of %s (%d)',
          locationName,
          getCleanPath(otherLocation._path),
          otherPriority,
          getCleanPath(location._path),
          thisPriority
        );
        // Note: Since we killed this location, it shouldn't end up seenLocations
        locations.splice(i, 1);
        deDuped++;
      }

      const crosscheckReport = crosscheck(location, otherLocation);
      if (crosscheckReport) {
        log(
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
    } else {
      seenLocations[locationName] = location; // this is the first time we've seen this
    }
  }

  console.log('✅ De-duped %d locations and found %d crosscheck failures! ', deDuped, crossCheckFailures);

  return { ...args, deDuped, crosscheckReports };
};

export default dedupeLocations;
