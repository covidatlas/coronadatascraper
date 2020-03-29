const stream = require('stream');
const { promisify } = require('util');
const fs = require('fs');
const got = require('got');

const pipeline = promisify(stream.pipeline);

export const downloadFile = async (url, dest) => {
  await pipeline(got.stream(url), fs.createWriteStream(dest));
};
