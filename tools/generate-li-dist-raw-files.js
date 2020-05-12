/**
 *
 * Helper script to run to call the li tools/gen-raw-files.js, passing
 * the appropriate args.  This script gens files to dist-raw in this
 * project, so they can be consumed during CDS report generaion.
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

/**
 * Entry point
 */

const liFilePath = path.join(liDir, liScript);
if (!fs.existsSync(liFilePath)) throw new Error(`Missing li script at ${liFilePath}`);

// Convert args to Li script args.
const scriptArgs = [];
scriptArgs.push(['--output', generateFilesToDir]);
if (argv.date) scriptArgs.push(['--date', argv.date]);
if (argv.endDate) scriptArgs.push(['--endDate', argv.endDate]);

// Exec.
const args = scriptArgs.flat().join(' ');
execSync(`node ${liScript} ${args}`, { cwd: liDir, stdio: 'inherit' });
