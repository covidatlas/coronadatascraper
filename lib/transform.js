import crypto from 'crypto';

/*
  Convert an object keyed on county name to an array
*/
function objectToArray(object) {
  let array = [];
  for (let [county, data] of Object.entries(object)) {
    array.push(Object.assign({
      county: county
    }, data));
  }
  return array;
}

/*
  Append ' County' to the end of a string, if not already present
*/
function addCounty(string) {
  if (!string.match(/ County$/)) {
    string = string + ' County';
  }
  return string;
}

/*
  Get the full name of a location
*/
function getName(location) {
  let name = '';
  let sep = '';
  if (location.city) {
    name += location.county;
    sep = ', ';
  }
  if (location.county) {
    name += sep + location.county;
    sep = ', ';
  }
  if (location.state) {
    name += sep + location.state;
    sep = ', ';
  }
  if (location.country) {
    name += sep + location.country;
    sep = ', ';
  }
  return name;
}

/*
  MD5 hash a given string
*/
function hash(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

/*
  Get date formatted in YYYY-M-D
*/
function getYYYYMD(date = new Date(), sep = '-') {
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var year = date.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
}

/*
  Get date formatted in YYYY-M-D
*/
function getYYYYMMDD(date = new Date(), sep = '-') {
  var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');;
  var day = date.getUTCDate().toString().padStart(2, '0');
  var year = date.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
}

/*
  Get date formatted in DD-MM-YYYY
*/
function getDDMMYYYY(date = new Date(), sep = '-') {
  var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');;
  var day = date.getUTCDate().toString().padStart(2, '0');
  var year = date.getUTCFullYear();

  return `${day}${sep}${month}${sep}${year}`;
}

/*
  Get date formatted in M/D/YYYY
*/
function getMDYYYY(date = new Date(), sep = '/') {
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var year = date.getUTCFullYear();

  return `${month}${sep}${day}${sep}${year}`;
}

/*
  Get date formatted in M/D/YY
*/
function getMDYY(date = new Date(), sep = '/') {
  var month = date.getUTCMonth() + 1;
  var day = date.getUTCDate();
  var year = date.getUTCFullYear().toString().substr(2, 2);

  return `${month}${sep}${day}${sep}${year}`;
}

export { objectToArray, addCounty, getName, hash, getYYYYMD, getYYYYMMDD, getMDYYYY, getMDYY, getDDMMYYYY };
