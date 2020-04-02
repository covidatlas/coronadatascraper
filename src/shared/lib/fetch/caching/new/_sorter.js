/**
 * Just a dumb sorter for 8601Z stuff
 */
export default function sorter(arr) {
  return arr.sort((a, b) => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  });
}
