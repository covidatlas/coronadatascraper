import iso from './iso/index.js';
import old from './old/index.js';

export default process.env.USE_ISO_DATETIME ? iso : old;
