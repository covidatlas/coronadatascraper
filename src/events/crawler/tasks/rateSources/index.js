import calculateRatings from './calculateRatings.js';
import validateRatings from './validateRatings.js';

const rateSources = async args => calculateRatings(args).then(validateRatings);

export default rateSources;
