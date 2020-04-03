const imports = require('esm')(module);

const path = imports('path');
const geography = imports('../src/shared/lib/geography/index.js');
const fs = imports('../src/shared/lib/fs.js');

async function generate() {
  // Pull in entire county list
  const countyPopulationData = await fs.readCSV(
    path.join('src', 'events', 'processor', 'vendor', 'population', 'population-usa-counties.csv')
  );

  // Create stripped map
  const strippedCountyMap = {};
  for (const county of countyPopulationData) {
    strippedCountyMap[geography.stripCountyName(county.name)] = county.name;
  }

  fs.writeJSON(path.join('src', 'shared', 'vendor', 'usa-countymap-stripped.json'), strippedCountyMap);
}

generate();
