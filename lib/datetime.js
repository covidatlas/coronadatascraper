/*
  Get a date object offset for the current timezone
*/
function getDate() {
  let date = new Date();
  date.setHours(date.getHours() - date.getTimezoneOffset() / 60);
  return date;
}

/*
  Get date formatted in YYYY-M-D
*/
function getYYYYMD(date = getDate(), sep = '-') {
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var year = date.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
}

/*
  Get date formatted in YYYY-M-D
*/
function getYYYYMMDD(date = getDate(), sep = '-') {
  var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');;
  var day = date.getUTCDate().toString().padStart(2, '0');
  var year = date.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
}

/*
  Get date formatted in DD-MM-YYYY
*/
function getDDMMYYYY(date = getDate(), sep = '-') {
  var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');;
  var day = date.getUTCDate().toString().padStart(2, '0');
  var year = date.getUTCFullYear();

  return `${day}${sep}${month}${sep}${year}`;
}

/*
  Get date formatted in M/D/YYYY
*/
function getMDYYYY(date = getDate(), sep = '/') {
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var year = date.getUTCFullYear();

  return `${month}${sep}${day}${sep}${year}`;
}

/*
  Get date formatted in M/D/YY
*/
function getMDYY(date = getDate(), sep = '/') {
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var year = date.getUTCFullYear().toString().substr(2, 2);

  return `${month}${sep}${day}${sep}${year}`;
}

/*
  Check of the *date* of the passed date is before the other passed date
  *sigh*
*/
function dateIsBefore(a, b) {
  a = new Date(a);
  b = new Date(b);
  a.setHours(0,0,0,0);
  b.setHours(0,0,0,0);
  return a < b;
}

/*
  Check if the date we're scraping is before the passed date
*/
function scrapeDateIsBefore(date) {
  let scrapeDate = getDate();
  if (process.env['SCRAPE_DATE']) {
    scrapeDate = new Date(process.env['SCRAPE_DATE']);
  }
  return dateIsBefore(scrapeDate, new Date(date));
}

function scrapeDateIsAfter(date) {
  let scrapeDate = getDate();
  if (process.env['SCRAPE_DATE']) {
    scrapeDate = new Date(process.env['SCRAPE_DATE']);
  }
  return dateIsBefore(new Date(date), scrapeDate);
}

export { getDate, getYYYYMD, getYYYYMMDD, getMDYYYY, getMDYY, getDDMMYYYY, dateIsBefore, scrapeDateIsBefore, scrapeDateIsAfter };
