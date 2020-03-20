import scrapers from '../scrapers.js';
import * as transform from '../lib/transform.js';
import * as datetime from '../lib/datetime.js';
import calculateRating from '../lib/rating.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths', 'active'];

const scraperVars = ['type', 'timeseries', 'headless', 'ssl', 'priority'];

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
  Combine location information with the passed data object
*/
function addLocationToData(data, location) {
  Object.assign(data, location);

  delete data.scraper;

  // Add rating
  data.rating = calculateRating(data);

  // Store for usage in ratings
  data._scraperDefinition = location;

  return data;
}

/*
  Check if the provided data contains any invalid fields
*/
function isValid(data) {
  if (data.cases === undefined) {
    throw new Error(`Invalid data: contains no case data`);
  }

  for (const [prop, value] of Object.entries(data)) {
    if (value === null) {
      throw new Error(`Invalid data: ${prop} is null`);
    }
    if (Number.isNaN(value)) {
      throw new Error(`Invalid data: ${prop} is not a number`);
    }
  }

  for (const prop of numericalValues) {
    if (data[prop] !== undefined && typeof data[prop] !== 'number') {
      throw new Error(`Invalid data: ${prop} is not a number`);
    }
  }

  return true;
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
  Clean the passed data
*/
function clean(data) {
  removePrivate(data);

  // Remove non-data vars
  for (const prop of scraperVars) {
    delete data[prop];
  }

  return data;
}

/*
  Clean the passed data
*/
function normalize(data) {
  // Normalize states
  if (data.country === 'USA') {
    data.state = transform.toUSStateAbbreviation(data.state);
  }

  // Normalize countries
  data.country = transform.toISO3166Alpha3(data.country);

  return data;
}

/*
  Add output data to the cases array. Input can be either an object or an array
*/
function addData(cases, location, result) {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      throw new Error(`Invalid data: scraper for ${transform.getName(location)} returned 0 rows`);
    }
    for (const data of result) {
      if (isValid(data, location)) {
        cases.push(addLocationToData(data, location));
      }
    }
  } else if (isValid(result, location)) {
    cases.push(addLocationToData(result, location));
  }
}

/*
  Run the correct scraper for this location
*/
export function runScraper(location) {
  const rejectUnauthorized = location.certValidation === false;
  if (rejectUnauthorized) {
    // Important: this prevents SSL from failing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  if (typeof location.scraper === 'function') {
    return location.scraper();
  }
  if (rejectUnauthorized) {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  if (typeof location.scraper === 'object') {
    // Find the closest date
    const targetDate = process.env.SCRAPE_DATE || datetime.getDate();
    let scraperToUse = null;
    for (const [date, scraper] of Object.entries(location.scraper)) {
      if (datetime.dateIsBeforeOrEqualTo(date, targetDate)) {
        scraperToUse = scraper;
      }
    }
    if (scraperToUse === null) {
      throw new Error(`Could not find scraper for ${transform.getName(location)} at ${process.env.SCRAPE_DATE}, only have: ${Object.keys(location.scraper).join(', ')}`);
    }
    return scraperToUse.call(location);
  }

  throw new Error('Why on earth is the scraper for %s a %s?', transform.getName(location), typeof scraper);
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
  Begin the scraping process
*/
async function scrape(options) {
  const crosscheckReports = {};
  const locations = [];
  const errors = [];
  for (const location of await scrapers()) {
    if (options.location) {
      if (transform.getName(location) !== options.location) {
        continue;
      }
    }
    if (options.skip) {
      if (transform.getName(location) === options.skip) {
        continue;
      }
    }
    if (location.scraper) {
      try {
        addData(locations, location, await runScraper(location));
      } catch (err) {
        console.error('  ❌ Error processing %s: ', transform.getName(location), err);

        errors.push({
          name: transform.getName(location),
          url: location.url,
          err: err.toString()
        });
      }
    }
  }

  // Normalize data
  for (const [index] of Object.entries(locations)) {
    const location = locations[index];
    locations[index] = normalize(location);
    location.active = location.active === undefined || location.active === null ? transform.getActiveFromLocation(location) : location.active;
  }

  // De-dupe data
  const seenLocations = {};
  let i = locations.length;
  let deDuped = 0;
  while (i-- > 0) {
    const location = locations[i];
    const locationName = transform.getName(location);
    const otherLocation = seenLocations[locationName];

    if (otherLocation) {
      // Take rating into account to break ties
      const thisPriority = transform.getPriority(location) + location.rating / 2;
      const otherPriority = transform.getPriority(otherLocation) + otherLocation.rating / 2;

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

  // Generate ratings
  const sourceProps = ['rating', 'city', 'county', 'state', 'country', 'type', 'timeseries', 'headless', 'aggregate', 'ssl', 'priority', 'url', 'curators', 'sources', 'maintainers'];

  const sourcesByURL = {};
  for (const location of locations) {
    const sourceObj = { ...location._scraperDefinition };
    for (const prop of sourceProps) {
      if (location[prop] !== undefined) {
        sourceObj[prop] = location[prop];
      }
    }
    for (const prop in sourceObj) {
      if (prop[0] === '_') {
        delete sourceObj[prop];
      }
    }

    delete sourceObj.scraper;

    // Remove granularity from the data since this is a report on the scraper
    if (sourceObj.aggregate) {
      delete sourceObj[sourceObj.aggregate];
    }

    sourcesByURL[location.url] = sourceObj;
    sourceObj.rating = calculateRating(sourceObj);
  }
  let sourceRatings = Object.values(sourcesByURL);
  sourceRatings = sourceRatings.sort((a, b) => {
    return b.rating - a.rating;
  });

  // Clean data
  for (const [index] of Object.entries(locations)) {
    locations[index] = clean(locations[index]);
  }

  return { locations, errors, deDuped, sourceRatings, crosscheckReports };
}

const scrapeData = async ({ report, options }) => {
  console.log(`⏳ Scraping data for ${process.env.SCRAPE_DATE ? process.env.SCRAPE_DATE : 'today'}...`);

  const { locations, errors, deDuped, sourceRatings, crosscheckReports } = await scrape(options);

  const locationCounts = {
    cities: 0,
    states: 0,
    counties: 0,
    countries: 0
  };
  const caseCounts = {
    cases: 0,
    tested: 0,
    recovered: 0,
    deaths: 0,
    active: 0
  };
  for (const location of locations) {
    if (!location.state && !location.county) {
      locationCounts.countries++;
    } else if (!location.county) {
      locationCounts.states++;
    } else if (!location.city) {
      locationCounts.counties++;
    } else {
      locationCounts.cities++;
    }

    for (const type of Object.keys(caseCounts)) {
      if (location[type]) {
        caseCounts[type] += location[type];
      }
    }
  }

  console.log('✅ Data scraped!');
  for (const [name, count] of Object.entries(locationCounts)) {
    console.log('   - %d %s', count, name);
  }
  console.log('ℹ️  Total counts (tracked cases, may contain duplicates):');
  for (const [name, count] of Object.entries(caseCounts)) {
    console.log('   - %d %s', count, name);
  }

  if (errors.length) {
    console.log('❌ %d error%s', errors.length, errors.length === 1 ? '' : 's');
  }

  report.scrape = {
    numCountries: locationCounts.countries,
    numStates: locationCounts.states,
    numCounties: locationCounts.counties,
    numCities: locationCounts.cities,
    numDuplicates: deDuped,
    numErrors: errors.length,
    crosscheckReports,
    errors
  };

  return { locations, report, options, sourceRatings };
};

export default scrapeData;
