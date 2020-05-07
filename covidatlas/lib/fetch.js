/* global XMLHttpRequest */

export const url = function(urlToFetch) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.addEventListener('load', () => {
      resolve(req.responseText);
    });
    req.addEventListener('error', reject);
    req.addEventListener('abort', reject);
    req.open('GET', urlToFetch);
    req.send();
  });
};

export const json = function(urlToFetch) {
  return url(urlToFetch).then(function(responseText) {
    let obj;
    try {
      obj = JSON.parse(responseText);
    } catch (err) {
      throw new Error(`Failed to parse JSON from ${urlToFetch}: ${err}`);
    }
    return obj;
  });
};
