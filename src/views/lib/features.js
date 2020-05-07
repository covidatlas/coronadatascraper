const findFeature = (module.exports.findFeature = function(featureCollection, id) {
  return featureCollection.features.find(feature => feature.properties.id === id);
});

module.exports.filterFeatureCollectionByLocations = function(featureCollection, locations) {
  if (!Array.isArray(locations)) {
    locations = [locations];
  }

  return {
    type: 'FeatureCollection',
    features: locations.map(location => findFeature(featureCollection, location.featureId)).filter(Boolean)
  };
};
