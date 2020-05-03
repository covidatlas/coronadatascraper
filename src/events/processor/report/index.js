import log from '../../../shared/lib/log.js';

export default function reportScraping(locations, report) {
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
    if (location.city) {
      locationCounts.cities++;
    } else if (location.county) {
      locationCounts.counties++;
    } else if (location.state) {
      locationCounts.states++;
    } else {
      locationCounts.countries++;
    }

    for (const type of Object.keys(caseCounts)) {
      if (location[type]) {
        caseCounts[type] += location[type];
      }
    }
  }

  log('✅ Data scraped!');
  for (const [name, count] of Object.entries(locationCounts)) {
    log('   - %d %s', count, name);
  }
  log('ℹ️  Total counts (tracked cases, may contain duplicates):');
  for (const [name, count] of Object.entries(caseCounts)) {
    log('   - %d %s', count, name);
  }
  const n = report.errors.length;
  if (n) {
    log('❌ %d error%s', n, n === 1 ? '' : 's');
  }

  report.numCountries = locationCounts.countries;
  report.numStates = locationCounts.states;
  report.numCounties = locationCounts.counties;
  report.numCities = locationCounts.cities;
}
