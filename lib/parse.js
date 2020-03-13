function number(string) {
  return parseInt(string.replace(/[^\d]/g, ''), 10);
}

function string(string) {
  // Remove zero-width space
  return string.trim().replace(/\u200B/g,'');
}

export { number, string };
