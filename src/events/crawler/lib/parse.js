/*
  Turn the provided string into a number, ignoring non-numeric data
*/
export const number = function(string) {
  if (typeof string === 'number') return string;
  if (string === '') return 0;
  if (string === undefined) throw new Error('Cannot parse undefined as number.');
  return parseInt(string.replace(/[^\d-]/g, ''), 10);
};

/*
  Turn the provided string into a floating point number
*/
export const float = function(string) {
  if (string === '') return 0;
  return parseFloat(string.replace(/[^\d.-]/g, ''));
};

/*
  Remove line breaks, double spaces, zero-width space, asterisk, and trim the provided string
*/
export const string = function(string) {
  return string
    .replace(/\n/g, ' ')
    .replace(/\s+/, ' ')
    .replace(/\u200B/g, '')
    .replace(/\*/g, '')
    .trim();
};
