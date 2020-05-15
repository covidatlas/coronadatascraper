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

export class NotImplementedError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

export class NotImplemented extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'NotImplemented';
  }
}
