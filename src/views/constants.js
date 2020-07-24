const disclaimer = `COVID Atlas is for informational purposes only and does not offer medical advice. Data quality and accuracy is subject to official sources; COVID Atlas does not guarantee the accuracy or timeliness of this data. For questions about the data, contact your local health officials.`;

const prod = process.env.NODE_ENV === 'production';

module.exports = {
  name: 'COVID Atlas',
  repoURL: 'https://github.com/covidatlas/li/',
  slackURL: 'https://join.slack.com/t/covid-atlas/shared_invite/zt-d6j8q1lw-C4t00WbmIjoxeHgxn_GDPQ',
  issueURL: 'https://github.com/covidatlas/li/issues/new/choose',
  analyticsCode: prod ? 'UA-166126663-1' : 'UA-166126663-2',
  prod,
  disclaimer
};
