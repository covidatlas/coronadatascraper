import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';
import csvStringify from 'csv-stringify';
import log from './log.js';

/**
  Check if a file or directory exists
*/
export const exists = async filePath => {
  return fs.existsSync(filePath);
};

/**
  When given a missing directory, it creates it
*/
export const ensureDir = async dirPath => {
  if (dirPath) {
    if (!(await exists(dirPath))) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }
};

/**
 * Returns the list of files at the given directory path
 *
 * @throws ENOENT if directory does not exist
 */
export const getFilesInDir = async dirPath => {
  return fs.promises.readdir(dirPath);
};

/**
  Read and return the file's content at a given path.

  @throws ENOENT if file does not exists.
*/
export const readFile = async (filePath, encoding = 'utf8') => {
  return fs.promises.readFile(filePath, encoding);
};

const stripBOM = content => {
  content = content.toString();
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  return content;
};

/**
  Read and return a JSON file at a given path.

  @throws ENOENT if file does not exists.
*/
export const readJSON = async filePath => {
  return JSON.parse(stripBOM(await readFile(filePath)));
};

/**
  Read and return a CSV file at a given path.

  @throws ENOENT if file does not exists.
*/
export const readCSV = async filePath => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await readFile(filePath);

      csvParse(
        data,
        {
          columns: true
        },
        (err, output) => {
          if (err) {
            reject(err);
          } else {
            resolve(output);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Write data to a file
 *
 * @param {*} filePath path to write
 * @param {*} data data to write
 * @param {*} options
 *  - ensureDir: creates a directory if it is missing
 */
export const writeFile = async (filePath, data, options = {}) => {
  let localOptions = options;
  localOptions = { ensureDir: true, ...localOptions };

  if (localOptions.ensureDir) {
    await ensureDir(path.dirname(filePath));
  }

  const ret = await fs.promises.writeFile(filePath, data);

  log(`✏️  ${filePath} written`);

  return ret;
};

/**
  Write JSON to a file
*/
export const writeJSON = async (filePath, data, options = {}) => {
  return writeFile(filePath, JSON.stringify(data, null, 2), options);
};

/**
  Write CSV to a file
*/
export const writeCSV = async (filePath, data, options = {}) => {
  return new Promise(async (resolve, reject) => {
    csvStringify(data, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(writeFile(filePath, output, options));
      }
    });
  });
};
