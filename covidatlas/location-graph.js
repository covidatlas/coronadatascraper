/* globals d3, document */

// const fields = [
//   {
//     name: 'cases',
//     color: 'orange'
//   },
//   {
//     name: 'deaths',
//     color: 'red'
//   }
// todo: what to do about tested?
// {
//   name: 'recovered',
//   color: 'green'
// },
// {
//   name: 'hospitalized',
//   color: 'red'
// },
// {
//   name: 'discharged',
//   color: 'red'
// }
// ];
/*
  [
    date: 'YYYY-MM-DD'
  ]
*/

function generateGraphData({ timeseries, location }) {
  const graphData = [];
  for (const date in timeseries) {
    if (!timeseries[date][location.id] || !timeseries[date][location.id].cases) {
      continue;
    }
    const obj = {
      ...timeseries[date][location.id],
      date
    };
    graphData.push(obj);
  }

  return graphData;
}

function copyData(arr) {
  const arrCopy = [];
  arr.forEach(d => {
    arrCopy.push({
      cases: d.cases,
      deaths: d.deaths,
      date: d.date
    });
  });
  return arrCopy;
}

function showGraph({ timeseries, location }) {
  // Controller vars
  let graphType = 'overview'; // overview or daily
  let linLog = 'linear'; // linear or log
  let dataKey = 'cases'; // cases or deaths

  //
  // Data
  // Format date and remove invalid entries

  let data = generateGraphData({ timeseries, location });

  // Format Dates for browser compatability
  const parseTime = d3.timeParse('%Y-%m-%d');

  data.forEach(function(d) {
    d.date = parseTime(d.date);
  });

  // Filter out any objects with values containing null or undefined
  function cleanData({ cases, deaths, date }) {
    if (cases === undefined || cases === null) {
      return false;
    }
    if (deaths === undefined || deaths === null) {
      return false;
    }
    if (date === undefined || date === null) {
      return false;
    }
    return true;
  }
  data = data.filter(cleanData);

  // set the dimensions and margins of the graph
  const el = document.querySelector('#graph');
  const margin = { top: 20, right: 5, bottom: 30, left: 50 };
  const width = el.offsetWidth - margin.left - margin.right;
  const height = el.offsetHeight - margin.top - margin.bottom;

  // Call generate graph
  // generateGraph();

  function generateGraph() {
    // Clear any previous graph
    d3.selectAll('#graph > *').remove();

    // append the svg object to the #graph of the page
    const svg = d3
      .select('#graph')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.right})`);

    //
    // Overview graph - Line Graph
    //

    function showOverviewGraph(data) {
      // Data
      // Make a copy of data array for modification
      const modData = copyData(data);

      // Modify data points to be >= 1 for log graph
      if (linLog === 'log') {
        modData.forEach(d => {
          if (d.deaths === 0) {
            d.deaths = 1;
          }
          if (d.cases === 0) {
            d.cases = 1;
          }
        });
      }

      const xValue = d => d.date;
      const xLabel = 'date';
      const yValue = d => d[dataKey];
      const yLabel = dataKey;

      //
      // Configure x scale
      //
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(modData, xValue))
        .range([0, width]);

      // Append x axis data onto chart
      g.append('g')
        .call(d3.axisBottom(xScale))
        .attr('transform', `translate(0,${height})`);
      // Append x axis data onto chart
      g.append('text')
        .attr('class', 'bottom-axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom)
        .text(xLabel);

      //
      // Configure y scale
      // Configure for depending on linear or logarithmic
      // Default is linear
      let yScale = d3
        .scaleLinear()
        .domain([0, d3.max(modData, d => yValue(d))])
        .range([height, 0]);

      // Reassign yScale to be log graph

      if (linLog === 'log') {
        yScale = d3
          .scaleLog()
          .base(2)
          .domain([1, d3.max(modData, d => yValue(d))])
          .range([height, 0]);
      }

      // Add y axis data (domain / range )
      g.append('g').call(d3.axisLeft(yScale));
      // Add y axis title and positioning
      // x and y positioning reversed due to rotation
      g.append('text')
        .attr('class', 'left-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', '-40px')
        .text(yLabel);

      // Create paths for lines for different data
      const lineGenerator = d3
        .line()
        .x(d => xScale(xValue(d)))
        .y(d => yScale(yValue(d)))
        .curve(d3.curveBasis);
      // Line for 'cases' (default)
      g.append('path')
        .attr('class', 'graph-line graph-line-cases')
        .attr('d', lineGenerator(modData));

      // Line for 'deaths'
      dataKey = 'deaths';
      g.append('path')
        .attr('class', 'graph-line graph-line-deaths')
        .attr('d', lineGenerator(modData));

      // Reset vars for rebuilding of graph
      dataKey = 'cases';
      // gData = data;
    }

    //
    // Daily Change Graph
    //

    function showDailyGraph(data) {
      const dailyData = [];

      const xValue = d => d.date;
      const xLabel = 'date';
      const yValue = d => d[dataKey];
      const yLabel = dataKey;

      // Find the cases and deaths per day and format date for display
      const formatTime = d3.timeFormat('%m/%d');

      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          dailyData.push({
            cases: data[i].cases,
            deaths: data[i].deaths,
            date: formatTime(data[i].date)
          });
          continue;
        }
        const cases = data[i].cases - data[i - 1].cases;
        const deaths = data[i].deaths - data[i - 1].deaths;
        const date = formatTime(data[i].date);

        // If there is an error in data and a negative number results do not add it to array
        if (cases < 0 || deaths < 0) {
          continue;
        }

        dailyData.push({
          cases,
          deaths,
          date
        });
      }
      // console.log(dailyData);

      //
      // Configure x scale
      //
      const xScale = d3
        .scaleBand()
        .domain(dailyData.map(d => xValue(d)))
        .range([0, width])
        .padding(0.25);

      // Append x axis data onto chart
      // Tick values adjusts how many dates are displayed on x axis
      g.append('g')
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % 3))))
        .attr('transform', `translate(0,${height})`)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-65)');
      // Append x axis label onto chart
      g.append('text')
        .attr('class', 'bottom-axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom)
        .text(xLabel);

      //
      // Configure y scale
      // Configure for depending on linear or logarithmic
      // Default is linear
      let yScale = d3
        .scaleLinear()
        .domain([0, d3.max(dailyData, d => yValue(d))])
        .range([height, 0]);

      // Reassign yScale to be log graph

      if (linLog === 'log') {
        yScale = d3
          .scaleLog()
          .base(2)
          .domain([1, d3.max(dailyData, d => yValue(d))])
          .range([height, 0]);

        // const yValue = d => d[dataKey];
        // yValue;
      }

      // Add y axis data (domain / range )
      g.append('g').call(d3.axisLeft(yScale));
      // Add y axis title and positioning
      // x and y positioning reversed due to rotation
      g.append('text')
        .attr('class', 'left-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', '-40px')
        .text(yLabel);

      // Append bars onto graph
      g.selectAll('rect')
        .data(dailyData)
        .enter()
        .append('rect')
        .attr('x', d => xScale(xValue(d)))
        .attr('y', d => yScale(yValue(d)))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(yValue(d)));
      // .attr('class', `bar-${dataKey}`);
    }

    //
    // controller
    //

    if (graphType === 'overview') {
      showOverviewGraph(data);
    } else if (graphType === 'daily') {
      showDailyGraph(data);
    } else {
      console.log('No graph type inputted');
    }
  }
  generateGraph();

  const btnOverview = document.getElementById('graph-btn-overview');
  const btnLinear = document.getElementById('graph-btn-linear');
  const btnLog = document.getElementById('graph-btn-log');
  const btnDaily = document.getElementById('graph-btn-daily');
  const btnCases = document.getElementById('graph-btn-cases');
  const btnDeaths = document.getElementById('graph-btn-deaths');

  // On load
  btnCases.disabled = true;
  btnDeaths.disabled = true;

  btnOverview.addEventListener('click', () => {
    graphType = 'overview';

    btnCases.disabled = true;
    btnDeaths.disabled = true;

    btnLinear.disabled = false;
    btnLog.disabled = false;
    generateGraph();
  });

  btnLinear.addEventListener('click', () => {
    linLog = 'linear';
    generateGraph();
  });

  btnLog.addEventListener('click', () => {
    linLog = 'log';
    generateGraph();
  });

  btnDaily.addEventListener('click', () => {
    graphType = 'daily';

    btnLinear.disabled = true;
    btnLog.disabled = true;

    btnCases.disabled = false;
    btnDeaths.disabled = false;
    generateGraph();
  });

  btnCases.addEventListener('click', () => {
    dataKey = 'cases';
    generateGraph();
  });

  btnDeaths.addEventListener('click', () => {
    dataKey = 'deaths';
    generateGraph();
  });
}

export default showGraph;
