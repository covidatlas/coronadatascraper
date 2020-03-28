const reportScraping = args => {
  const { locations, scraperErrors, deDuped, crosscheckReports, report } = args;

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
    } else if (!location.county && !location.city) {
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

  if (scraperErrors.length) {
    console.log('❌ %d error%s', scraperErrors.length, scraperErrors.length === 1 ? '' : 's');
  }

  report.scrape = {
    numCountries: locationCounts.countries,
    numStates: locationCounts.states,
    numCounties: locationCounts.counties,
    numCities: locationCounts.cities,
    numDuplicates: deDuped,
    numErrors: scraperErrors.length,
    crosscheckReports,
    errors: scraperErrors
  };

  return args;
};

export default reportScraping;
