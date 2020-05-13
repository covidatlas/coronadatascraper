/**
 *
 * Helper script to run to call the li tools/gen-raw-files.js, passing
 * the appropriate args.  This script gens files to dist-raw in this
 * project, so they can be consumed during CDS report generaion.
 *
 * Argv notes:
 * - pass '--timeseries' if this will be used to gen timeseries
 * - pass '--debug' to debug log some things in the li script
 *
 */

const imports = require('esm')(module);
const path = require('path');
const fs = require('fs');

const { execSync } = imports('child_process');
const argv = imports(path.join(__dirname, '..', 'src', 'shared', 'cli', 'cli-args.js')).default;

const generateFilesToDir = path.join(__dirname, '..', 'dist-raw');

const liDir = path.join(__dirname, '..', '..', 'li');

const liScript = path.join('tools', 'gen-raw-files.js');

/** Generate Li files in a sync child process. */
export default function generateLiFiles(argv) {
  // Always delete old raw files.  Reports read these files, and if the
  // raw files are present, they will be stale.
  if (fs.existsSync(generateFilesToDir)) fs.rmdirSync(generateFilesToDir, { recursive: true });
  fs.mkdirSync(generateFilesToDir);

  if (argv.debug) {
    console.log('=======================================================');
    console.log(argv);
    console.log('=======================================================');
  }

  if (!argv.addli) {
    console.log('Not including Li files in reports.');
    return;
  }
  console.log(`Including Li files in reports, running li/${liScript}`);

  // Sanity check, script exists.
  const liFilePath = path.join(liDir, liScript);
  if (!fs.existsSync(liFilePath)) throw new Error(`Missing li script at ${liFilePath}`);

  let { date } = argv;

  // If no date specified and this is being used for timeseries, then
  // start at the hardcoded date in src/shared/timeseries/index.js.
  if (!date && argv.timeseries) date = '2020-01-22';

  // Convert args to Li script args.
  const scriptArgs = [];
  scriptArgs.push(['--output', generateFilesToDir]);
  if (date) scriptArgs.push(['--date', date]);
  if (argv.debug) scriptArgs.push(['--debug', argv.debug]);
  if (argv.endDate) scriptArgs.push(['--endDate', argv.endDate]);

  // Exec.
  const args = scriptArgs.flat().join(' ');
  execSync(`node ${liScript} ${args}`, { cwd: liDir, stdio: 'inherit' });
}

/**
 * Entry point
 */

if (!module.parent) {
  generateLiFiles(argv);
}
