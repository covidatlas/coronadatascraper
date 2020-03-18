import scrapers from '../scrapers.js';
import * as transform from '../lib/transform.js';
import calculateRating from '../lib/rating.js';

const numericalValues = ['cases', 'tested', 'recovered', 'deaths', 'active'];

const scraperVars = ['type', 'timeseries', 'headless', 'ssl', 'priority'];

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
  Clean the passed data
*/
function clean(data) {
  for (const [prop, value] of Object.entries(data)) {
    if (value === '') {
      delete data[prop];
    }
    // Remove "private" fields
    if (prop[0] === '_') {
      delete data[prop];
    }
  }

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
    Begin the scraping process
  */
async function scrape(options) {
  const locations = [];
  const errors = [];
  for (const location of scrapers) {
    if (options.only) {
      if (transform.getName(location) !== options.only) {
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
        addData(locations, location, await location.scraper());
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
    locations[index] = normalize(locations[index]);
  }

  // De-dupe data
  const seenLocations = {};
  let i = locations.length - 1;
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
    }
    seenLocations[locationName] = location;
  }

  // Generate ratings
  const sourceProps = ['rating', 'city', 'county', 'state', 'country', 'type', 'timeseries', 'headless', 'aggregate', 'ssl', 'priority', 'url'];

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

  return { locations, errors, deDuped, sourceRatings };
}

const scrapeData = async ({ report, options }) => {
  console.log(`⏳ Scraping data for ${process.env.SCRAPE_DATE ? process.env.SCRAPE_DATE : 'today'}...`);

  const { locations, errors, deDuped, sourceRatings } = await scrape(options);

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

    location.active = location.active === undefined ? transform.getActiveFromLocation(location) : location.active;

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
    errors
  };

  return { locations, report, options, sourceRatings };
};

export default scrapeData;
