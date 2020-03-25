const scoresheet = {
  easeOfRead: {
    json: 1,
    csv: 1,
    table: 0.75,
    list: 0.5,
    paragraph: -1,
    pdf: -2,
    image: -3,
    png: -3,
    jpg: -3
  },
  timeseries: 1.75,
  completeness: {
    cases: 0.5,
    tested: 1,
    deaths: 1,
    recovered: 1,
    country: 0.5,
    state: 0.5,
    county: 1,
    city: 0.5
  },
  aggregateWorth: 1.5, // agregate is gold
  headlessWorth: -0.5, // headless should be avoided
  sslWorth: 0.25
};

const rateLocation = location => {
  let rating = 0;

  // Rate for completeness
  rating += Object.entries(scoresheet.completeness).reduce(
    (sum, [key, value]) => (location[key] !== null && location[key] !== undefined ? value : 0) + sum,
    0
  );

  rating += scoresheet.easeOfRead[location.type];

  // Add points if using SSL
  if (location.url.substr(0, 5) === 'https' && location.certValidation !== false) {
    location.ssl = true;
    rating += scoresheet.sslWorth;
  } else {
    location.ssl = false;
  }

  // Dock some points if we have to go headless
  if (location.headless) {
    rating += scoresheet.headlessWorth;
  }

  // Aggregate sources are gold
  if (location.aggregate) {
    rating += scoresheet.aggregateWorth;
  }

  if (location.timeseries) {
    rating += scoresheet.timeseries;
  }

  rating += scoresheet.easeOfRead[location.type] || 0;

  return rating;
};

const calculateRatings = async args => {
  console.log(`⏳ Calculate ratings`);

  const { sources, locations } = args;

  const scoreBySource = {};
  sources.forEach(source => {
    scoreBySource[source._path] = source;
  });

  for (const location of locations) {
    location.rating = rateLocation(location);

    scoreBySource[location._path].url = location.url;
    scoreBySource[location._path].type = location.type;
    scoreBySource[location._path].ssl = location.ssl;
    scoreBySource[location._path].rating = Math.max(scoreBySource[location._path].rating || -100, location.rating);
  }

  const sourceRatings = sources.filter(source => source.rating !== undefined).sort((a, b) => b.rating - a.rating);

  return { ...args, sourceRatings };
};

export default calculateRatings;
