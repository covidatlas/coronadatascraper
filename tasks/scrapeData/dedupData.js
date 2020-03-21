import * as geography from '../../lib/geography.js';

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
  Remove "private" object properties
*/
function removePrivate(data) {
  for (const [prop, value] of Object.entries(data)) {
    if (value === '') {
      delete data[prop];
    }
    // Remove "private" fields
    if (prop[0] === '_') {
      delete data[prop];
    }
  }

  return data;
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

/*
  Get the priority of a location
*/
const getPriority = location => {
  return location.priority !== undefined ? location.priority : 0;
};

const dedupLocations = args => {
  const { locations } = args;

  const crosscheckReports = {};
  const seenLocations = {};
  let i = locations.length;
  let deDuped = 0;
  while (i-- > 0) {
    const location = locations[i];
    const locationName = geography.getName(location);
    const otherLocation = seenLocations[locationName];

    if (otherLocation) {
      // Take rating into account to break ties
      const thisPriority = getPriority(location) + location.rating / 2;
      const otherPriority = getPriority(otherLocation) + otherLocation.rating / 2;

      if (otherPriority === thisPriority) {
        console.log('⚠️  %s: Equal priority sources choosing %s (%d) over %s (%d) arbitrarily', locationName, location.url, thisPriority, otherLocation.url, otherPriority);
        // Kill the other location
        locations.splice(locations.indexOf(otherLocation), 1);
        deDuped++;
      } else if (otherPriority < thisPriority) {
        // Kill the other location
        console.log('✂️  %s: Using %s (%d) instead of %s (%d)', locationName, location.url, thisPriority, otherLocation.url, otherPriority);
        locations.splice(locations.indexOf(otherLocation), 1);
        deDuped++;
      } else {
        // Kill this location
        console.log('✂️  %s: Using %s (%d) instead of %s (%d)', locationName, otherLocation.url, otherPriority, location.url, thisPriority);
        locations.splice(i, 1);
        deDuped++;
      }

      const crosscheckReport = crosscheck(location, otherLocation);
      if (crosscheckReport) {
        console.log('🚨  Crosscheck failed for %s: %s (%d) has different data than %s (%d)', locationName, otherLocation.url, otherPriority, location.url, thisPriority);

        crosscheckReports[locationName] = crosscheckReports[locationName] || [];
        const strippedLocation = removePrivate(location);
        if (!existsInCrosscheckReports(strippedLocation, crosscheckReports[locationName])) {
          crosscheckReports[locationName].push(strippedLocation);
        }
        const stippedOtherLocation = removePrivate(otherLocation);
        if (!existsInCrosscheckReports(stippedOtherLocation, crosscheckReports[locationName])) {
          crosscheckReports[locationName].push(stippedOtherLocation);
        }
      }
    }
    seenLocations[locationName] = location;
  }

  return { ...args, deDuped, crosscheckReports };
};

export default dedupLocations;
