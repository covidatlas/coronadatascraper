// Turf "bundler" for just the functions we need – saves >20MB!
import * as turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import * as turfCenter from '@turf/center';
import * as turfUnion from '@turf/union';
import * as turfHelpers from '@turf/helpers';

const booleanPointInPolygon = turfBooleanPointInPolygon;
const center = turfCenter;
const union = turfUnion;
const point = turfHelpers;
const feature = turfHelpers;

export { booleanPointInPolygon, center, feature, point, union };
