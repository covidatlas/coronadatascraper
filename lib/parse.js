function number(string) {
  return parseInt(string.replace(/[^\d]/g, ''), 10);
}

function string(string) {
  // Remove line breaks, double spaces, zero-width space, and trim
  return string.replace(/\n/g, ' ').replace(/\s+/, ' ').replace(/\u200B/g,'').trim();
}

export { number, string };
