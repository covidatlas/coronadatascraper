export const normalizePercent = function(min, max, input) {
  const range = max - min;
  const correctedStartValue = input - min;
  const percentage = (correctedStartValue * 100) / range;
  return percentage / 100;
};

// Via https://math.stackexchange.com/a/57510
export const adjustTanh = function(value, a = 0, b = 3) {
  return Math.min(Math.tanh(value + a) * b, 1);
};

export const getRatio = function(fractional, total) {
  if (fractional === 0) {
    return '-';
  }
  return `1 : ${Math.round(total / fractional).toLocaleString()}`;
};

export const getPercent = function(fractional, total) {
  if (fractional === 0) {
    return '-';
  }
  return `${((1 / Math.round(total / fractional)) * 100).toFixed(4)}%`;
};
