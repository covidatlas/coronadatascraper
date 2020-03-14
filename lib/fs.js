import fs from 'fs';

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

export { readFile, readJSON, writeFile, writeJSON, exists };
