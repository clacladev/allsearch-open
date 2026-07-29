import crypto from 'crypto';

/**
 * Returns a signature of the input data.
 * @param data The input data to hash.
 * @returns 44-chars base64 string
 */
export function getSignature(data: any) {
  return crypto
    .createHash('sha256')
    .update(typeof data === 'string' ? data : JSON.stringify(data))
    .digest('base64');
}

/**
 * Returns a unique id of the input data.
 * @param data The input data to hash.
 * @param length The length of the unique id.
 * @returns 16-chars hex string
 */
export function getUniqueId(data: any, length: number = 16) {
  return crypto
    .createHash('sha256')
    .update(typeof data === 'string' ? data : JSON.stringify(data))
    .digest('hex')
    .slice(0, length);
}
