/**
 * Make a filesystem-friendly timestamp from our cache file format
 * - filename: `2020-03-31T12:34:567Z`
 * - 8601Z:    `2020-03-31t12_34_567z`
 */
const convert = {
  filenameToZ8601: ts => {
    return ts.replace(/_/g, ':').toUpperCase();
  },
  Z8601ToFilename: filename => {
    return filename.replace(/:/g, '_').toLowerCase();
  }
};

export default convert;
