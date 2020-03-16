import scrapers from '../scrapers.js';
import * as transform from '../lib/transform.js';

/*
  Combine location information with the passed data object
*/
function addLocationToData(data, location) {
  Object.assign(data, location);

  delete data.scraper;

  return data;
}

/*
  Check if the provided data contains any invalid fields
*/
function isValid(data, location) {
  if (data.cases === undefined) {
    throw new Error(`Invalid data: contains no case data`);
  }

  for (let [prop, value] of Object.entries(data)) {
    if (value === null) {
      throw new Error(`Invalid data: ${prop} is null`);
    }
    if (Number.isNaN(value)) {
      throw new Error(`Invalid data: ${prop} is not a number`);
    }
  }

  return true;
}

/*
  Clean the passed data
*/
function clean(data) {
  // Normalize states
  if (data.country === 'USA') {
    data.state = transform.toUSStateAbbreviation(data.state);
  }

  // Normalize countries
  data.country = transform.toISO3166Alpha3(data.country);

  for (let [prop, value] of Object.entries(data)) {
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
  Add output data to the cases array. Input can be either an object or an array
*/
function addData(cases, location, result) {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      throw new Error(`Invalid data: scraper for ${transform.getName(location)} returned 0 rows`);
    }
    for (let data of result) {
      if (isValid(data, location)) {
        cases.push(addLocationToData(data, location));
      }
    }
  } else {
    if (isValid(result, location)) {
      cases.push(addLocationToData(result, location));
    }
  }
}

/*
    Begin the scraping process
  */
async function scrape() {
  let locations = [];
  let errors = [];
  for (let location of scrapers) {
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

  // De-dupe and clean data
  let seenLocations = {};
  let i = locations.length - 1;
  let deDuped = 0;
  while (i--) {
    let location = locations[i];
    let locationName = transform.getName(location);
    let otherLocation = seenLocations[locationName];
    if (otherLocation) {
      let thisPriority = transform.getPriority(location);
      let otherPriority = transform.getPriority(otherLocation);
      if (otherPriority === thisPriority) {
        console.log('⚠️  %s: Equal priority sources choosing %s (%d) over %s (%d)', locationName, location.url, thisPriority, otherLocation.url, otherPriority);
        // Kill the other location
        locations.splice(locations.indexOf(otherLocation), 1);
        deDuped++;
      }
      else if (otherPriority < thisPriority) {
        // Kill the other location
        console.log('✂️  %s: Using %s (%d) instead of %s (%d)', locationName, location.url, thisPriority, otherLocation.url, otherPriority);
        locations.splice(locations.indexOf(otherLocation), 1);
        deDuped++;
      }
      else {
        // Kill this location
        console.log('✂️  %s: Using %s (%d) instead of %s (%d)', locationName, otherLocation.url, otherPriority, location.url, thisPriority);
        locations.splice(i, 1);
        deDuped++;
      }
    }
    seenLocations[locationName] = location;
  }

  // Clean data
  for (let [index, location] of Object.entries(locations)) {
    locations[index] = clean(locations[index]);
  }


  return { locations, errors, deDuped };
}

const scrapeData = async ({ report }) => {
  console.log(`⏳ Scraping data for ${process.env['SCRAPE_DATE'] ? process.env['SCRAPE_DATE'] : 'today'}...`);

  const { locations, errors, deDuped } = await scrape();

  let states = 0;
  let counties = 0;
  let countries = 0;
  for (let location of locations) {
    if (!location.state && !location.county) {
      countries++;
    } else if (!location.county) {
      states++;
    } else {
      counties++;
    }
    location['active'] = location['active'] === undefined ? transform.getActiveFromLocation(location) : location['active'];
  }

  console.log('✅ Data scraped!');
  console.log('   - %d countries', countries);
  console.log('   - %d states', states);
  console.log('   - %d counties', counties);
  console.log('   - %d duplicates removed', deDuped);
  console.log('❌ %d errors', errors.length);

  report['scrape'] = {
    numCountries: countries,
    numStates: states,
    numCounties: counties,
    numDuplicates: deDuped,
    numErrors: errors.length,
    errors
  };

  return { locations, report };
};

export default scrapeData;
