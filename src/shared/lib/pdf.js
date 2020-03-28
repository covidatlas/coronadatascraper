/**
 * Returns 2D array of items on each row of the document. Each row consists of an array of elements present on that row.
 *
 * @param rowTolerance allowed variance in the y-axis. Allows elements with small discrepancies in their y
 *                  value to be considered as being part of the same row, defaults to 1 unit
 */
export const asRows = (data, rowTolerance = 1) => {
  const output = [];
  let rows = {};

  let currentPage = 1;
  for (const item of data) {
    if (!item || item.page > currentPage) {
      const currentRows = rows;
      // end of page
      output.push(
        ...Object.keys(currentRows) // => array of y-positions (type: float)
          // sort float positions
          .sort((y1, y2) => parseFloat(y1) - parseFloat(y2))
          // sort x positions and add to data array
          .map(y => currentRows[y].sort((item1, item2) => parseFloat(item1.x) - parseFloat(item2.x)))
      );
      rows = {}; // clear rows for next page
      currentPage += 1;
    } else {
      let { y } = item;

      // We set y to an existing row if within tolerance
      Object.keys(rows).forEach(yKey => {
        if (Math.abs(yKey - y) < rowTolerance) {
          y = yKey;
        }
      });

      // accumulate text items into rows object, per line
      const row = rows[y] || [];

      row.push(item);

      rows[y] = row;
    }
  }

  return output;
};

/**
 * Combines elements of the PDF that are likely to be one word
 * @param {*} data
 * @param {*} rowTolerance allowed variance in the y-axis. Allows elements with small discrepancies in their y
 *                  value to be considered as being part of the same word, defaults to 1 unit
 * @param {*} wordTolerance allowed variance in the x-axis. Allows elements with small discrepancies in their x
 *                  value to be considered as being part of the same word, defaults to 1 unit
 */
export const asWords = (data, rowTolerance = 1, wordTolerance = 1) => {
  const rows = asRows(data, rowTolerance);

  const output = [];
  for (const row of rows) {
    if (row && row.length > 0) {
      const words = [row[0]];

      for (const item of row.slice(1)) {
        const lastWord = words[words.length - 1];

        const dist = Math.abs(lastWord.x - item.x);

        if (dist < wordTolerance) {
          lastWord.text += item.text;
          // Width of elements in PDFs are weird. Sometimes they are accurate, sometimes they are not.
          // A good estimation of the width of our word is to take the current width per character and assume that any
          // additional letter we add to this word has the same width.
          lastWord.w *= lastWord.text.length / (lastWord.text.length - 1);
        } else {
          words.push(item);
        }
      }

      output.push(words);
    }
  }

  return output;
};

const euclideanDistance = (a, b) => Math.sqrt((a.x + a.w / 2 - b.x - b.w / 2) ** 2 + (a.y - b.y) ** 2);

/**
 * Returns all the text nearest to the provided item
 *
 * @param {*} target item to find nearest for
 * @param {*} data array of all PDF items
 */
export const getNearest = (target, data) => {
  return data
    .filter(item => item.page === target.page) // ignore elements not on the target's page
    .sort((a, b) => euclideanDistance(target, a) - euclideanDistance(target, b)) // sort by smallest distance
    .map(item => item.text); // we only want text
};
