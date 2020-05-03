import calculateRatings from './calculate-ratings.js';
import validateRatings from './validate-ratings.js';

export default async function rateSources(sources, locations) {
  const ratings = await calculateRatings(sources, locations);
  return validateRatings(ratings);
}
