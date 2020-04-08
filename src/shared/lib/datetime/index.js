import newDates from './iso/index.js';
import old from './old/index.js';

const iso = {
  ...newDates,
  old
};

export default process.env.USE_OLD_DATETIME ? old : iso;
