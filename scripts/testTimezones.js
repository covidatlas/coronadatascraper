/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-use-before-define */
const test = require('tape');
const spawn = require('tape-spawn');
const { execSync } = require('child_process');
const os = require('os');
const ianaWin = require('windows-iana');

// This script runs date-related tests in multiple timezones to make sure that we don't have any
// timezone-related heisenbugs. For example, this will fail if the system runtime is east of GMT:
//
// ```js
// test('timezone heisenbug', () => {
//   const d = new Date('2020-3-16');
//   expect(getYYYYMMDD(d)).toBe('2020-03-16'); // sometimes we get 2020-03-15
// });
// ```

const isWindows = os.platform() === 'win32';
const currentSystemTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const startingTimezone = currentSystemTimezone();

const WARNING = `
WARNING: On Windows, this script actually changes the system timezone. If the script doesn't exit
normally, you may be left in the wrong timezone. You can set it back by running this from the
command line:

    tzutil /s "${startingTimezone}"
`;

// Utilities to change & restore the system timezone

const setTZ = inputTZ => {
  const tz = lookupTZ(inputTZ);
  if (isWindows) {
    // on windows we use the command-line `tzutil` utility
    execSync(`tzutil /s "${tz}"`);
    process.on('exit', restoreTZ); // clean up when done
    process.on('SIGINT', () => {
      restoreTZ();
      process.exit(2);
    }); // clean up when interrupted with ctrl-C
  } else {
    // on linux etc. we can just set this environment variable
    process.env.TZ = tz;
  }
};

const restoreTZ = () => {
  if (startingTimezone && startingTimezone !== currentSystemTimezone()) {
    setTZ(startingTimezone);
  }
};

const lookupTZ = inputTZ => {
  if (inputTZ === 'UTC') return inputTZ;
  const tz = isWindows
    ? ianaWin.findWindows(inputTZ) //
    : ianaWin.findOneIana(inputTZ) || inputTZ;
  if (!tz) throw new Error(`The timezone '${inputTZ}' does not exist. Please provide a valid Windows or IANA time.`);
  return tz;
};

// Test

const timezones = ['America/Chicago', 'UTC', 'Australia/Sydney', startingTimezone];

if (isWindows) console.log('\n', WARNING);

process.env.DEBUG = 'tape-spawn';
for (const timezone of timezones) {
  test(`${timezone}`, async t => {
    await new Promise(resolve => {
      setTZ(timezone);
      console.log(`changed to ${timezone}`);
      const st = spawn(t, `yarn tape tests/**/datetime-test.js`, { end: false });
      st.succeeds('datetime tests pass');
      st.end(() => {
        t.end();
        resolve();
      });
    });
  });
}

restoreTZ();
