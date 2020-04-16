/** Diff two strings. */

export default function stringDiff(lhs, rhs) {
  if (lhs === null || rhs === null) throw new Error('Missing lhs or rhs');

  const ret = { column: null, left: '', right: '' };
  let foundDiff = false;

  const minLen = lhs.length < rhs.length ? lhs.length : rhs.length;
  for (let i = 0; i < minLen; ++i) {
    const lc = lhs[i];
    const rc = rhs[i];
    if (lc !== rc) {
      foundDiff = true;
      ret.column = i + 1;
      ret.left = lc;
      ret.right = rc;
      break;
    }
  }

  // Likely much better way to handle this.
  if (!foundDiff && lhs.length < rhs.length) {
    foundDiff = true;
    const pos = lhs.length + 1;
    ret.column = pos;
    ret.left = '(end-of-string)';
    ret.right = rhs[pos - 1];
  }
  if (!foundDiff && rhs.length < lhs.length) {
    foundDiff = true;
    const pos = rhs.length + 1;
    ret.column = pos;
    ret.right = '(end-of-string)';
    ret.left = lhs[pos - 1];
  }

  return ret;
}
