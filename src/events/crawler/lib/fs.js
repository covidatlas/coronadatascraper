import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';
import csvStringify from 'csv-stringify';

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
export const readFile = async filePath => {
  return fs.promises.readFile(filePath, 'utf8');
};

/**
  Read and return a JSON file at a given path.

  @throws ENOENT if file does not exists.
*/
export const readJSON = async filePath => {
  return JSON.parse(await readFile(filePath));
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
        function(err, output) {
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
 *  - silent: the function will not write to console on write success
 *  - ensureDir: creates a directory if it is missing
 */
export const writeFile = async (filePath, data, options = {}) => {
  options = { silent: false, ensureDir: true, ...options };

  if (options.ensureDir) {
    await ensureDir(path.dirname(filePath));
  }

  const ret = await fs.promises.writeFile(filePath, data);

  if (!options.silent) {
    console.log(`✏️  ${filePath} written`);
  }

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
