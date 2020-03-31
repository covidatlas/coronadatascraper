/* globals Chart, document */

let chart;

const options = {
  maintainAspectRatio: false,
  title: {
    display: true,
    fontSize: 20
  },
  scales: {
    xAxes: [
      {
        type: 'time',
        distribution: 'linear',
        time: {
          minUnit: 'day'
        },
        ticks: {
          major: {
            enabled: true,
            fontStyle: 'bold'
          },
          source: 'data',
          sampleSize: 100
        }
      }
    ],
    yAxes: [
      {
        type: 'linear',
        gridLines: {
          drawBorder: false
        },
        major: {
          enabled: true,
          fontStyle: 'bold'
        },
        scaleLabel: {
          display: true,
          labelString: 'Linear (click graph for logarithmic)'
        },
        ticks: {
          autoSkip: true,

          userCallback(label) {
            if (this.options.type === 'linear') {
              return label;
            }
            const remain = label / 10 ** Math.floor(Chart.helpers.log10(label));
            if (remain === 1 || remain === 2 || remain === 5) {
              return label;
            }
          }
        }
      }
    ]
  },
  legend: {
    labels: {
      usePointStyle: true,
      filter(labelItem, data) {
        const curr = data.datasets.find(d => d.label === labelItem.text);
        if (curr.data.length) {
          return labelItem;
        }
      }
    }
  },
  tooltips: {
    intersect: false,
    mode: 'nearest',
    position: 'nearest',
    axis: 'x',
    callbacks: {
      title(tooltipItem) {
        return new Date(tooltipItem[0].label).toLocaleDateString();
      },
      label(tooltipItem, data) {
        let label = data.datasets[tooltipItem.datasetIndex].label || '';
        if (label) {
          label += ': ';
        }
        label += parseInt(tooltipItem.value, 10);
        return label;
      }
    }
  },
  events: ['mousemove', 'mouseout', 'click'],
  onClick() {
    const { type } = this.options.scales.yAxes[0];
    if (type === 'linear') {
      this.options.scales.yAxes[0].type = 'logarithmic';
      this.options.scales.yAxes[0].scaleLabel.labelString = 'Logarithmic (click graph for linear)';
    } else {
      this.options.scales.yAxes[0].type = 'linear';
      this.options.scales.yAxes[0].scaleLabel.labelString = 'Linear (click graph for logarithmic)';
    }
    this.update();
    this.render();
  }
};

const showGraph = (location, locationData) => {
  const casesData = [];
  const activeData = [];
  const deathsData = [];
  const recoveredData = [];

  locationData.forEach(day => {
    const date = new Date(day.date);

    if (day.cases)
      casesData.push({
        y: day.cases,
        t: date
      });

    if (day.active)
      activeData.push({
        y: day.active,
        t: date
      });

    if (day.deaths)
      deathsData.push({
        y: day.deaths,
        t: date
      });

    if (day.recovered)
      recoveredData.push({
        y: day.recovered,
        t: date
      });
  });

  const lineSettings = {
    type: 'line',
    lineTension: 0.1,
    spanGaps: true,
    fill: false
  };

  const data = {
    datasets: [
      {
        label: 'Total Cases',
        borderColor: '#FF00FF',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        data: casesData,
        ...lineSettings
      },
      {
        label: 'Active Cases',
        borderColor: '#FF0000',
        backgroundColor: '#FF0000',
        data: activeData,
        ...lineSettings
      },
      {
        label: 'Deaths',
        borderColor: '#00FF00',
        backgroundColor: '#00FF00',
        data: deathsData,
        ...lineSettings
      },
      {
        label: 'Recovered',
        borderColor: '#0000FF',
        backgroundColor: '#0000FF',
        data: recoveredData,
        ...lineSettings
      }
    ]
  };

  options.scales.xAxes[0].ticks.max = casesData[casesData.length - 1].t;
  options.title.text = location.name;

  if (chart) {
    chart.options = options;
    chart.data = data;
    chart.update();
    chart.render();
  } else {
    Chart.defaults.global.defaultFontFamily = 'aglet-slab, sans-serif';
    Chart.defaults.global.defaultFontSize = 16;
    Chart.defaults.global.defultFontColor = '#334E62';

    chart = new Chart('graph', { data, options });
  }

  document.getElementById('graph-elements').style.visibility = 'visible';
};

export default showGraph;
