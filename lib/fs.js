import fs from 'fs';
import csvParse from 'csv-parse';
import csvStringify from 'csv-stringify';

/*
  Check if a file exists
*/
async function exists(filePath) {
  return await fs.promises.access(filePath, fs.constants.R_OK).then(() => true).catch(() => false);
}

/*
  Read a file
*/
async function readFile(filePath) {
  return await fs.promises.readFile(filePath);
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
    let data = await readFile(filePath);

    csvParse(data, {
      columns: true
    }, function(err, output) {
      if (err) {
        reject(err);
      }
      else {
        resolve(output);
      }
    });
  });
}

/*
  Write a file
*/
async function writeFile(filePath, data) {
  return await fs.promises.writeFile(filePath, data);
}

/*
  Write JSON
*/
async function writeJSON(filePath, data) {
  return await writeFile(filePath, JSON.stringify(data, null, 2));
}

/*
  Write CSV
*/
async function writeCSV(filePath, data) {
  return new Promise(async (resolve, reject) => {
    csvStringify(data, (err, output) => {
      if (err) {
        reject(err);
      }
      else {
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
    return await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

export { readFile, readJSON, readCSV, writeFile, writeJSON, writeCSV, exists, ensureDir };
