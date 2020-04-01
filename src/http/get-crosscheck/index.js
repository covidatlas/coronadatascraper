exports.handler = async function http() {
  // .gitignore */dist/
  // glob things at build time, get cache filenames, store in get-crosscheck/dist/
  // copy report.json into get-crosscheck/dist/
  // make HTML
  // profit
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: `Crosscheck!`
  };
};
