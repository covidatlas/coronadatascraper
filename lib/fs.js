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
  Write a file
*/
async function writeFile(filePath, data) {
  return await fs.promises.writeFile(filePath, data);
}

export { readFile, writeFile, exists};
