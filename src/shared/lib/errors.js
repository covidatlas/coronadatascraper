/* eslint-disable import/prefer-default-export */

export class DeprecatedError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'DeprecatedError';
  }
}
