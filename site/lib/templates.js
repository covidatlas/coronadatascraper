const replacements = {
  'Cabinet for Health and Family Services': 'HFS',
  'Department of Health & Human Resources': 'DHHR',
  'Department of Health and Human Services': 'HHS',
  'Emergency and Preparedness Information': 'E&P',
  'Health and Human Services': 'HHS',
  'Department of Health': 'DoH',
  'Public Health Department': 'DPH',
  'Department of Public Health': 'DoH',
  Department: 'Dept.',
  Information: 'Info.'
};
function shortenName(name) {
  for (const [search, replace] of Object.entries(replacements)) {
    name = name.split(' - ').shift();
    name = name.replace(search, replace);
  }
  return name;
}

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

/**
 * @param {{name: string, country: string?, flag: string?}[]} contributors
 */
export const getContributors = function(contributors, options = { link: true, shortNames: false }) {
  let html = '';

  if (contributors) {
    for (const [index, contributor] of Object.entries(contributors)) {
      // Only show first source
      if (options.shortNames && index > 0) {
        break;
      }

      if (index !== '0') {
        html += ', ';
      }
      const contributorURL = options.link && getURLFromContributor(contributor);
      if (contributorURL) {
        html += `<a href="${contributorURL}" class="spectrum-Link">`;
      }
      if (options.shortNames) {
        html += shortenName(contributor.name);
      } else {
        html += contributor.name;
      }
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
