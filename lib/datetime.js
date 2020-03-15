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

export { getDate, getYYYYMD, getYYYYMMDD, getMDYYYY, getMDYY, getDDMMYYYY };
