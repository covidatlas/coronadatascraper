/**
 * Sometimes the AUS government doesn't sum numbers properly, so give them 10% slack.
 * @param {number} computed
 * @param {number} scraped
 */
const areNumbersClose = (computed, scraped) => computed * 0.9 < scraped && computed * 1.1 > scraped;

export default areNumbersClose;
