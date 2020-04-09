const imports = require('esm')(module);

const lunr = imports('lunr');
const fs = imports('../shared/lib/fs.js');

function getShortName(location) {
  return location.name.replace(/(\s|,)+/g, '-').toLowerCase();
}

async function buildIndex(locations) {
  const skinnyLocations = {};

  const index = lunr(function() {
    this.ref('slug');
    this.field('name');

    locations.forEach(function(location) {
      const slug = getShortName(location);
      const skinnyLocation = {
        name: location.name
        // city: location.city,
        // county: location.county,
        // state: location.state,
        // country: location.country
      };

      skinnyLocations[slug] = skinnyLocation;

      this.add({
        slug,
        ...skinnyLocation
      });
    }, this);
  });

  await fs.ensureDir('src/http/get-api-locations/dist/');
  await fs.writeJSON('src/http/get-api-locations/dist/search.json', index);
  await fs.writeJSON('src/http/get-api-locations/dist/skinnyLocations.json', skinnyLocations);
}

async function build(arc, cloudformation) {
  console.log('🤹‍♀️ Preparing Lambdae...');

  // Destroy proxy at root so we can take that over in `get /:location`
  if (cloudformation) {
    try {
      delete cloudformation.Resources.CovidAtlas.Properties.DefinitionBody.paths['/{proxy+}'];
    } catch (err) {
      console.log('Could not destroy root proxy config, deployment may fail');
    }
  }

  await Promise.all([
    fs.ensureDir('src/http/get-sources/dist/'),
    fs.ensureDir('src/http/get-crosscheck/dist/'),
    fs.ensureDir('src/http/get-000location/dist/')
  ]);

  await Promise.all([
    // fs.copyFile('dist/timeseries.json', 'public/timeseries.json'),
    // fs.copyFile('dist/locations.json', 'public/locations.json'),
    // fs.copyFile('dist/features.json', 'public/features.json'),
    fs.copyFile('dist/ratings.json', 'src/http/get-sources/dist/ratings.json'),
    fs.copyFile('dist/report.json', 'src/http/get-crosscheck/dist/report.json'),
    fs.copyFile('dist/timeseries.json', 'src/http/get-000location/dist/timeseries.json'),
    fs.copyFile('dist/features.json', 'src/http/get-000location/dist/features.json')
  ]);

  // Generate location map
  const locations = await fs.readJSON('dist/locations.json');
  const locationMap = {};
  for (const [index, location] of Object.entries(locations)) {
    const shortName = getShortName(location);
    location.id = index;
    locationMap[shortName] = location;
  }

  await fs.writeJSON('src/http/get-000location/dist/location-map.json', locationMap);
  await fs.writeJSON('src/http/get-index/dist/location-map.json', locationMap);

  await buildIndex(locations);

  return cloudformation;
}

module.exports = build;
