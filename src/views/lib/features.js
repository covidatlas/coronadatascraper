module.exports.findFeature = function(featureCollection, locationID) {
  return featureCollection[locationID];
};

module.exports.filterFeatureCollectionByLocations = function(featureCollection, locations) {
  if (!Array.isArray(locations)) {
    locations = [locations];
  }

  return {
    type: 'FeatureCollection',
    features: locations.map(location => featureCollection[location.locationID])
  };
};
