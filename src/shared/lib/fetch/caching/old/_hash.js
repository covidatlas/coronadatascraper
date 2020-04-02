import crypto from 'crypto';

/**
  MD5 hash a given string
*/
export default function hash(str) {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
}
