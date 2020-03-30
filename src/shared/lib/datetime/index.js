import old from './old/index.js';
import iso from './iso/index.js';

const datetime = process.env.USE_ISO_DATETIME
  ? {
      ...iso,
      iso
    }
  : {
      ...old,
      old
    };

export default datetime;
