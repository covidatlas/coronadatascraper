import path from 'path';

export default url => {
  const ext = path.extname(url);
  return url
    .replace(ext, '')
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-z0-9]/gi, '_');
};
