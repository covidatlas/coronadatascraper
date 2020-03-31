import path from 'path';
import * as geography from '../../../shared/lib/geography/index.js';
import * as transform from '../../../shared/lib/transform.js';
import log from '../../../shared/lib/log.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths'];

/*
  Returns an array, the first element being the items in numericalValues that are different between the 2
  sources, and the second element being the items that are the same
*/
function crosscheck(a, b) {
  const discrepancies = [];
  const agreements = [];
  for (const prop of numericalValues) {
    if ((a[prop] === 0 && b[prop] === undefined) || (b[prop] === 0 && a[prop] === undefined)) {
      // Don't complain about undefined when there should be zero, it's noise
      agreements.push(prop);
      continue;
    }
    if (a[prop] !== b[prop]) {
      discrepancies.push(prop);
    } else if (a[prop] !== undefined || b[prop] !== undefined) {
      agreements.push(prop);
    }
  }
  return [discrepancies, agreements];
}

/*
  Check if the passed stripped location object exists in the crosscheck report
*/
function existsInCrosscheckSources(location, crosscheckSourcesByLocation) {
  let exists = false;
  for (const existingLocation of crosscheckSourcesByLocation) {
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

function addCrosscheckReport(crosscheckReports, locationName, crosscheckResult, usedLocation, droppedLocation) {
  crosscheckReports[locationName] = crosscheckReports[locationName] || {
    location: {},
    used: 0,
    dropped: [],
    discrepancies: [],
    agreements: [],
    sources: []
  };
  const report = crosscheckReports[locationName];
  for (const locationType of ['city', 'county', 'state', 'country']) {
    if (usedLocation[locationType]) {
      report.location[locationType] = usedLocation[locationType];
    }
  }

  const discrepancies = [];
  const agreements = [];
  for (const prop of numericalValues) {
    if (report.discrepancies.indexOf(prop) > -1 || crosscheckResult[0].indexOf(prop) > -1) {
      discrepancies.push(prop);
    } else if (report.agreements.indexOf(prop) > -1 || crosscheckResult[1].indexOf(prop) > -1) {
      agreements.push(prop);
    }
  }
  report.discrepancies = discrepancies;
  report.agreements = agreements;

  const strippedUsedLocation = transform.removePrivate({ ...usedLocation });
  if (!existsInCrosscheckSources(strippedUsedLocation, report.sources)) {
    // Add to beginning of array so that the used source is always at index 0
    report.sources.unshift(strippedUsedLocation);
  }
  const strippedDroppedLocation = transform.removePrivate({ ...droppedLocation });
  if (!existsInCrosscheckSources(strippedDroppedLocation, report.sources)) {
    report.sources.push(strippedDroppedLocation);
  }
  /* Always add index to dropped because either we are adding a dropped item at the end of the array or
   * adding a new used item at the beginning of the array
   */
  report.dropped.push(report.sources.length - 1);
}

const dedupeLocations = args => {
  log(`⏳ De-duping locations...`);

  const { locations } = args;

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

      let usedLocation;
      let droppedLocation;
      if (otherPriority <= thisPriority) {
        // Delete the other location
        const message =
          otherPriority === thisPriority
            ? '⚠️  %s: Equal priority sources choosing %s (%d) over %s (%d) arbitrarily'
            : '✂️  %s: Using %s (%d) instead of %s (%d)';
        log(
          message,
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
        usedLocation = location;
        droppedLocation = otherLocation;
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
        usedLocation = otherLocation;
        droppedLocation = location;
      }

      const crosscheckResult = crosscheck(location, otherLocation);
      const message = crosscheckResult[0].length
        ? '  🚨  Crosscheck failed for %s: %s (%d) has different data than %s (%d)'
        : '  ⚠️  Crosscheck passed for %s: %s (%d) has same data as %s (%d). Logging duplicate.';
      log(
        message,
        locationName,
        getCleanPath(otherLocation._path),
        otherPriority,
        getCleanPath(location._path),
        thisPriority
      );
      addCrosscheckReport(crosscheckReports, locationName, crosscheckResult, usedLocation, droppedLocation);
      if (crosscheckResult[0].length) {
        crossCheckFailures++;
      }
    } else {
      seenLocations[locationName] = location; // this is the first time we've seen this
    }
  }

  log('✅ De-duped %d locations and found %d crosscheck failures! ', deDuped, crossCheckFailures);

  return { ...args, deDuped, crosscheckReports };
};

export default dedupeLocations;
