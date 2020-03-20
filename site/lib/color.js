import * as d3color from 'd3-color';

// eslint-disable-next-line import/prefer-default-export
export const getLightness = function(c) {
  return d3color.lab(c).l;
};
