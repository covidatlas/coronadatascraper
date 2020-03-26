import needle from 'needle';

const scraper = {
  country: 'RUS',
  aggregate: 'state',
  url: 'https://yandex.ru/maps/api/covid?csrfToken=',
  type: 'json',
  curators: [{ name: 'Yandex', url: 'https://yandex.ru' }],
  sources: [
    {
      description:
        'Data provided by Rospotrebnadzor (Federal Service for Surveillance on Consumer Rights Protection and Human Wellbeing)',
      name: 'Rospotrebnadzor',
      url: 'https://www.rospotrebnadzor.ru/'
    }
  ],
  maintainers: [
    {
      name: 'Arseniy Ivanov',
      twitter: '@freeatnet',
      github: 'freeatnet',
      email: 'arseniy+coronadatascraper@freeatnet.com'
    }
  ],
  async scraper() {
    const csrfRequestResponse = await needle('get', this.url, {}, { parse_response: true });
    const csrfCookies = csrfRequestResponse.cookies;
    const { csrfToken } = csrfRequestResponse.body;
    // assert typeof csrfToken !== 'undefined'

    const { body } = await needle('get', `${this.url}${csrfToken}`, { cookies: csrfCookies, parse_response: true });
    const { data } = body;
    // assert typeof data !== 'undefined'

    const ruEntries = data.items.filter(({ ru }) => ru);
    return ruEntries.map(({ name, cases, cured: recovered, deaths, coordinates }) => ({
      // The list contains data at federal subject level, which is the top-level political
      // divisions (including cities of Moscow and St Petersburg)
      state: name,
      cases,
      recovered,
      deaths,
      coordinates
    }));
  }
};

export default scraper;
