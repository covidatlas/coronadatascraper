function log(...args) {
  const suppressed = process.env.LOG_LEVEL === 'off';
  if (!suppressed) {
    console.log(...args);
  }
}

log.error = function(...args) {
  console.error(...args);
};

log.warn = function(...args) {
  console.warn(...args);
};

export { log as default };
