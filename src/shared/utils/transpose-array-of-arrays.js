/**
 * Change from columns then rows to rows then columns,
 * enables consistent tooling when manipulating tables in the scraper pipeline,
 * regardless of the table's orientation.
 *
 * @param {string[][]} arrayOfArrays array of columns, each with an array of text per row inside.
 * @returns {string[][]} arrayOfArrays array of rows, each with an array of text per column inside.
 */
const transposeArrayOfArrays = arrayOfArrays => {
  const transposedArray = [];
  arrayOfArrays.forEach((rowContent, rowIndex) => {
    rowContent.forEach((columnContent, columnIndex) => {
      transposedArray[columnIndex] = transposedArray[columnIndex] || [];
      transposedArray[columnIndex][rowIndex] = columnContent;
    });
  });
  return transposedArray;
};

module.exports = transposeArrayOfArrays;
