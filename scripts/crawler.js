// eslint-disable-next-line
const arc = require('@architect/functions');

arc.events.publish({
  name: 'crawler',
  payload: {
    options: { location: 'San Francisco County, CA, USA' }
  }
});
