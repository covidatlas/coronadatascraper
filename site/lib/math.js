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

export const getGrade = function(rating) {
  rating *= 200;

  if (rating >= 97) {
    return 'A+';
  }
  if (rating >= 93) {
    return 'A';
  }
  if (rating >= 90) {
    return 'A-';
  }
  if (rating >= 87) {
    return 'B+';
  }
  if (rating >= 83) {
    return 'B';
  }
  if (rating >= 80) {
    return 'B-';
  }
  if (rating >= 77) {
    return 'C+';
  }
  if (rating >= 73) {
    return 'C';
  }
  if (rating >= 70) {
    return 'C-';
  }
  if (rating >= 67) {
    return 'D+';
  }
  if (rating >= 63) {
    return 'D';
  }
  if (rating >= 60) {
    return 'D';
  }
  if (rating >= 57) {
    return 'F+';
  }
  if (rating >= 53) {
    return 'F';
  }
  if (rating >= 50) {
    return 'F';
  }
  return 'F-';
};
