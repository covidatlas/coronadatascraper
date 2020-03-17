import fs from 'fs';
import csvParse from 'csv-parse';
import csvStringify from 'csv-stringify';

/*
  Check if a file exists
*/
async function exists(filePath) {
  return fs.promises
    .access(filePath, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false);
}

/*
  Read a file
*/
async function readFile(filePath) {
  return fs.promises.readFile(filePath, 'utf8');
}

async function readFiles(dirPath) {
  return fs.promises.readdir(dirPath);
}

/*
  Read JSON
*/
async function readJSON(filePath) {
  return JSON.parse(await readFile(filePath));
}

/*
  Read a CSV file
*/
async function readCSV(filePath) {
  return new Promise(async (resolve, reject) => {
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
  });
}

/*
  Write a file
*/
async function writeFile(filePath, data, options = { silent: false }) {
  const ret = await fs.promises.writeFile(filePath, data);
  if (!options.silent) {
    console.log(`✏️  ${filePath} written`);
  }
  return ret;
}

/*
  Write JSON
*/
async function writeJSON(filePath, data) {
  return writeFile(filePath, JSON.stringify(data, null, 2));
}

/*
  Write CSV
*/
async function writeCSV(filePath, data) {
  return new Promise(async (resolve, reject) => {
    csvStringify(data, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(writeFile(filePath, output));
      }
    });
  });
}

/*
  Ensure dir
*/
async function ensureDir(dirPath) {
  if (!(await exists(dirPath))) {
    return fs.promises.mkdir(dirPath, { recursive: true });
  }
  return undefined;
}

export { readFile, readFiles, readJSON, readCSV, writeFile, writeJSON, writeCSV, exists, ensureDir };
