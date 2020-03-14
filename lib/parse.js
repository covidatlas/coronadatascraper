/*
  Turn the provided string into a number, ignoring non-numeric data
*/
function number(string) {
  if (string === '') {
    return 0;
  }
  return parseInt(string.replace(/[^\d]/g, ''), 10);
}

/*
  Remove line breaks, double spaces, zero-width space, asterisk, and trim the provided stirng
*/
function string(string) {
  return string.replace(/\n/g, ' ').replace(/\s+/, ' ').replace(/\u200B/g,'').replace(/\*/, '').trim();
}

export { number, string };
