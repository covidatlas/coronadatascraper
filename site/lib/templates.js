export const getURLFromContributor = function(curator) {
  if (!curator) {
    return '';
  }

  let url;
  if (curator.url) {
    url = curator.url;
  } else if (curator.twitter) {
    url = `https://twitter.com/${curator.twitter.replace('@', '')}`;
  } else if (curator.github) {
    url = `https://github.com/${curator.github}`;
  } else if (curator.email) {
    url = `mailto:${curator.email}`;
  }
  return url;
};

export const getContributors = function(contributors) {
  let html = '';

  if (contributors) {
    for (const [index, contributor] of Object.entries(contributors)) {
      if (index !== '0') {
        html += ', ';
      }
      const contributorURL = getURLFromContributor(contributor);
      if (contributorURL) {
        html += `<a href="${getURLFromContributor(contributor)}" class="spectrum-Link">`;
      }
      html += contributor.name;
      if (contributorURL) {
        html += `</a>`;
      }
      if (contributor && (contributor.country || contributor.flag)) {
        html += ' ';
        html += contributor.flag ? contributor.flag : `(${contributor.country})`;
      }
    }
  }

  return html;
};
