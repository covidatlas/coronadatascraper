const numberMap = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
};

/*
  Turn the provided string into a number, ignoring non-numeric data
*/
export const number = function(string) {
  if (typeof string === 'string' && numberMap[string.toLowerCase()]) {
    // yes, I was as angry as you are right now when I wrote this
    return numberMap[string.toLowerCase()];
  }

  if (typeof string === 'number') return string;
  if (string === '') return 0;
  if (string === undefined) throw new Error('Cannot parse undefined as number.');

  return parseInt(string.replace(/[^\d.-]/g, ''), 10);
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
    .replace(/\u200B/g, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ') // do this last since the prev 2 can create contiguous spaces
    .trim();
};
