/* eslint-disable jest/no-jest-import */

// See ./testTimezones.js
// The tests need to run in a child process in order for the timezone change to take effect.

const jest = require('jest');
const jestConfig = require('../package.json').jest;

const run = async () => {
  const { results } = await jest.runCLI(
    {
      ...jestConfig,
      testPathPattern: ['date']
    },
    ['.']
  );

  if (results.success) process.exit(0);
  else process.exit(1);
};

run();
