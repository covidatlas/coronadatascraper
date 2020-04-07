import calculateRatings from './calculate-ratings.js';
import validateRatings from './validate-ratings.js';

const rateSources = async args => calculateRatings(args).then(validateRatings);

export default rateSources;
