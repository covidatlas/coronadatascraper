const path = require('path');
const childProcess = require('child_process');

/**
 * Running crawler for each day in its own process.
 *
 * This will result in a slower execution time due to the child_process overheads,
 * but it will ensure that timeseries never runs out of memory.
 */
export default options =>
  new Promise((resolve, reject) => {
    const child = childProcess.fork(
      path.join('src', 'shared', 'timeseries', 'worker.js'),
      // Pass options as arguments
      Object.entries(options).reduce((args, entry) => {
        args.push(`--${entry[0]}`, entry[1]);
        return args;
      }, []),
      {
        stdio: ['ignore', 1, 2, 'ipc']
      }
    );

    // Results are communicated back via an IPC message
    child.on('message', resolve);

    // If the child process closes without sending a message, something went wrong
    child.on('close', reject);
  });
