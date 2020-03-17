import path from 'path';
import generate from './index.js';
import * as fs from './lib/fs.js';
import * as stringify from './lib/stringify.js';
import argv from './lib/cliArgs.js';

generate(argv.date, argv);
