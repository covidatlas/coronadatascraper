function number(string) {
  return parseInt(string.replace(/[^\d]/g, ''), 10);
}

export { number };