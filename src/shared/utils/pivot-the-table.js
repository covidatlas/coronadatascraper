const pivotTheTable = ($trs, $) => {
  const dataPairs = [];
  $trs.each((trIndex, tr) => {
    const $tr = $(tr);
    const $tds = $tr.find('td, th');
    $tds.each((tdIndex, td) => {
      const $td = $(td);
      dataPairs[tdIndex] = dataPairs[tdIndex] || [];
      dataPairs[tdIndex][trIndex] = $td.text();
    });
  });
  return dataPairs;
};

export default pivotTheTable;
