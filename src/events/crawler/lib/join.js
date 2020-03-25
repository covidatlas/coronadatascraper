import path from 'path';

// Join path and normalize to forward slash
export default (...args) => path.join(...args).replace(/\\/g, '/');
