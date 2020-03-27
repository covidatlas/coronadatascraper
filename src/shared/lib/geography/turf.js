// Turf "bundler" for just the functions we need – saves >20MB!
import * as turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon';
import * as turfCenter from '@turf/center';
import * as turfUnion from '@turf/union';
import { point, feature } from '@turf/helpers';

const booleanPointInPolygon = turfBooleanPointInPolygon.default;
const center = turfCenter.default;
const union = turfUnion.default;

export { booleanPointInPolygon, center, feature, point, union };
