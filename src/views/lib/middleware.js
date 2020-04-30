module.exports.handle404 = function(locationMap) {
  return async function handle404(req) {
    // See if the slug matches
    const { pathParameters } = req;
    const locationString = pathParameters.location.toLowerCase();
    const foundLocation = locationMap[locationString];
    if (foundLocation) {
      req.location = foundLocation;
      req.slug = locationString;
      return req;
    }

    return {
      statusCode: 404
    };
  };
};
