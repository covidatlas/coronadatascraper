const levelOrder = (module.exports.levels = ['city', 'county', 'state', 'country']);

const getSlug = (module.exports.getSlug = function(location) {
  return levelOrder
    .map(level => location[level])
    .filter(Boolean)
    .join(' ')
    .replace(/(\s|,)+/g, '-')
    .toLowerCase();
});

/** Get the full name of a location
 * @param {{ city: string?; county: string?; state: string?; country: string?; }} location
 */
module.exports.getName = location =>
  [location.city, location.county, location.state, location.country].filter(Boolean).join(', ');

const isCountry = (module.exports.isCountry = function(location) {
  return location && location.country && !location.state && !location.county && !location.city;
});

const isState = (module.exports.isState = function(location) {
  return location && location.state && !location.county && !location.city;
});

const isCounty = (module.exports.isCounty = function(location) {
  return location && location.county && !location.city;
});

const isCity = (module.exports.isCity = function(location) {
  return location && location.city;
});

module.exports.getLocationGranularityName = function(location) {
  if (isCountry(location)) {
    return 'country';
  }
  if (isState(location)) {
    return 'state';
  }
  if (isCounty(location)) {
    return 'county';
  }
  if (isCity(location)) {
    return 'city';
  }
  return 'none';
};

const childLevelOrder = levelOrder.slice().reverse();
module.exports.getChildLocations = function(location, locations, matchLevel) {
  const subLocations = [];

  // Find all its children
  const locationLevel = location.level;
  const index = childLevelOrder.indexOf(locationLevel);

  const mustMatch = childLevelOrder.slice(0, index + 1);

  for (const otherLocation of Object.values(locations)) {
    let matches = true;
    if (matchLevel) {
      if (otherLocation.level !== matchLevel) {
        continue;
      }
    }
    for (const field of mustMatch) {
      if (otherLocation[field] !== location[field]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      // Ensure slug is present
      otherLocation.slug = getSlug(otherLocation);
      subLocations.push(otherLocation);
    }
  }

  return subLocations;
};

const parentLevelOrder = levelOrder.concat(['world']);
const getParentLevel = (module.exports.getParentLevel = function(level) {
  return parentLevelOrder[Math.min(parentLevelOrder.indexOf(level) + 1, parentLevelOrder.length - 1)];
});

module.exports.getParentLocation = function(location, locations) {
  const parentLevel = getParentLevel(location.level);
  const index = parentLevelOrder.indexOf(parentLevel);
  const mustMatch = parentLevelOrder.slice(index, -1);

  const parentLocation = Object.values(locations).find(otherLocation => {
    if (otherLocation.level !== parentLevel) {
      return false;
    }

    let matches = true;
    for (const field of mustMatch) {
      if (otherLocation[field] !== location[field]) {
        matches = false;
        break;
      }
    }
    return matches;
  });

  // Ensure slug is present
  if (parentLocation) {
    parentLocation.slug = getSlug(parentLocation);
  }

  return parentLocation;
};

module.exports.getSiblingLocations = function(location, locations) {
  const { level } = location;
  const parentLevel = getParentLevel(level);

  if (parentLevel === 'world') {
    console.log('Will not look for siblings of %s', location.name);
    // Ideally, we find adjacent countries
    // Since this is not yet handled, just return the location
    return [location];
  }

  return Object.values(locations)
    .filter(otherLocation => {
      return otherLocation.level === level && otherLocation[parentLevel] === location[parentLevel];
    })
    .map(matchingLocation => {
      matchingLocation.slug = getSlug(matchingLocation);
      return matchingLocation;
    });
};
