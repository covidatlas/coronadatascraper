import crypto from 'crypto';

/**
 * Hash a given thing
 */
export default function hash(thing, len = 10) {
  return crypto
    .createHash('sha256')
    .update(thing)
    .digest('hex')
    .substr(0, len);
}
