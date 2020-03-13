function number(string) {
  return parseInt(string.replace(/[^\d]/g, ''), 10);
}

function string(string) {
  return string.trim();
}

export { number, string };
