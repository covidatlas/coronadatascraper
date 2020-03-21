/* global XMLHttpRequest */

export const url = function(urlToFetch, callback) {
  const req = new XMLHttpRequest();
  req.addEventListener('load', callback);
  req.open('GET', urlToFetch);
  req.send();
  return req;
};

export const json = function(urlToFetch, callback) {
  return url(urlToFetch, function() {
    let obj;
    try {
      obj = JSON.parse(this.responseText);
    } catch (err) {
      console.error('Failed to parse JSON from %s: %s', urlToFetch, err);
    }
    callback(obj);
  });
};
