import crypto from 'crypto';

/**
 * Hash a given thing
 */
export default function hash(thing, len = 100) {
  return (
    crypto
      // This *should* be a SHA, but it was massively faster to migrate the cache using the same also as before
      .createHash('md5') // TODO make me a SHA
      .update(thing)
      .digest('hex')
      .substr(0, len)
  );
}
