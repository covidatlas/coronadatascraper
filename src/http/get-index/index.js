const _body = require('./_body');

exports.handler = async function http() {
  const body = _body();
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body
  };
};
