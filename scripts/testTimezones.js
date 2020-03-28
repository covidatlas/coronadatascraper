/* eslint-disable jest/no-commented-out-tests */
/* eslint-disable no-use-before-define */

const { spawn, execSync } = require('child_process');
const os = require('os');

/* eslint-disable-next-line import/no-extraneous-dependencies */
const ianaWin = require('windows-iana');

// This script runs date-related tests in multiple timezones to make sure that we don't have any
// timezone-related heisenbugs. For example, this will fail if the system runtime is east of GMT:
//
// ```js
// test('timezone heisenbug', () => {
//   const d = new Date('2020-03-16');
//   expect(getYYYYMMDD(d)).toBe('2020-03-16'); // sometimes we get 2020-03-15
// });
// ```

// WARNING: On Windows, this script actually changes the system timezone. If the script doesn't exit
// normally, you may be left in the wrong timezone. You can set it back by running this from the
// command line:
//
// ```bash
// tzutil /s "Eastern Standard Time"
// ```
// (replacing `Eastern Standard Time`) with your timezone)

const isWindows = os.platform() === 'win32';
const currentSystemTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const startingTimezone = currentSystemTimezone();

const timezones = ['America/Chicago', 'UTC', 'Australia/Sydney', startingTimezone];

const run = async () => {
  console.log(`⏲  Initial timezone: ${startingTimezone}`);

  let failures = 0;
  for (const timezone of timezones) {
    setTZ(timezone);
    await pause(); // sometimes takes a few ticks to register

    console.log('');
    console.log('---------------------------');
    console.log(`⏲  Timezone changed to ${timezone}`);
    console.log('');
    try {
      await runTest(timezone);
      console.log(`✅ Tests passed for timezone ${timezone}`);
    } catch (err) {
      console.error(`❌ Tests failed for timezone ${timezone}`);
      failures++;
    }
    await pause();
  }

  console.log('');
  console.log('---------------------------');
  if (failures === 0) console.log(`✅ Tests passed for all ${timezones.length} timezones`);
  else console.error(`❌ Tests failed for ${failures} out of ${timezones.length} timezones`);

  console.log(`⏲  Timezone reset to ${currentSystemTimezone()}`);

  return failures ? 1 : 0;
};

const runTest = async () => {
  return new Promise((resolve, reject) => {
    const results = [];
    const pipeOutputToConsole = { stdio: [process.stdin, process.stdout, process.stderr] };
    const testWorker = spawn('node', ['./scripts/testTimezones_worker.js'], pipeOutputToConsole);
    testWorker.on('close', code => {
      if (code === 0) resolve(results);
      else reject(results);
    });
  });
};

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

const pause = (t = 500) => new Promise(ok => setTimeout(() => ok(), t));

// Execution

run().then(result => {
  process.exit(result);
});
