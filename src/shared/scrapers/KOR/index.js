import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';

const scraper = {
  country: 'KOR',
  aggregate: 'state', // Special cities have equal status to states.
  type: 'table',
  url: 'http://ncov.mohw.go.kr/en/bdBoardList.do?brdId=16&brdGubun=162&dataGubun=&ncvContSeq=&contSeq=&board_id=',
  sources: [
    {
      url: 'http://ncov.mohw.go.kr/en/bdBoardList.do?brdId=16&brdGubun=162&dataGubun=&ncvContSeq=&contSeq=&board_id=',
      name: 'Ministry of Health and Welfare'
    }
  ],
  maintainers: [
    {
      name: 'Jacob McGowan',
      github: 'jacobmcgowan'
    }
  ],
  _fieldHeadersOffset: 2,
  _fieldPositions: {
    cases: 3,
    recovered: 4,
    deaths: 5
  },
  _provinceNames: {
    'Chungcheongbuk-do': 'North Chungcheong',
    'Chungcheongnam-do': 'South Chungcheong',
    'Gangwon-do': 'Gangwon',
    'Gyeonggi-do': 'Gyeonggi',
    'Gyeongsangbuk-do': 'North Gyeongsang',
    'Gyeongsangnam-do': 'South Gyeongsang',
    'Jeollabuk-do': 'North Jeolla',
    'Jeollanam-do': 'South Jeolla',
    Lazaretto: 'Quarantine'
  },
  _population: {
    'Chungcheongbuk-do': 1588633,
    'Chungcheongnam-do': 2064665,
    'Gangwon-do': 1549780,
    'Gyeonggi-do': 12239862,
    'Gyeongsangbuk-do': 2739179,
    'Gyeongsangnam-do': 3374725,
    'Jeollabuk-do': 1895882,
    'Jeollanam-do': 1938136,
    Jeju: 583284,
    Seoul: 9904312,
    Busan: 3448737,
    Daegu: 2466052,
    Incheon: 2890451,
    Gwangju: 1502881,
    Daejeon: 1538394,
    Ulsan: 1166615,
    Sejong: 204088
  },
  /**
   * Parses the common name of the province that is used in the feature.
   * @param {string} officialEnglishName Official English name of the province.
   * @returns {string} The common name of the province or the city name if a
   * special city was given.
   */
  _parseProvince(officialEnglishName) {
    return this._provinceNames[officialEnglishName] || officialEnglishName;
  },
  /**
   * Checks if the fields are in the expected order.
   * @param {Cheerio} $headerRow The row of field headers.
   * @returns {boolean} Whether or not the field order is expected.
   */
  _isFieldOrderExpected($headerRow) {
    return (
      $headerRow &&
      $headerRow.length === 1 &&
      parse
        .string($headerRow.find(`th:nth-child(${this._fieldPositions.cases - this._fieldHeadersOffset})`).text())
        .toLowerCase()
        .includes('confirmed') &&
      parse
        .string($headerRow.find(`th:nth-child(${this._fieldPositions.recovered - this._fieldHeadersOffset})`).text())
        .toLowerCase()
        .includes('released') &&
      parse
        .string($headerRow.find(`th:nth-child(${this._fieldPositions.deaths - this._fieldHeadersOffset})`).text())
        .toLowerCase()
        .includes('deceased')
    );
  },
  async scraper() {
    const states = [];
    const $ = await fetch.page(this.url);
    const $table = $('table.num');

    if ($table.length === 0) throw new Error('Table not found');
    if (!this._isFieldOrderExpected($table.find('thead > tr:nth-child(2)'))) throw new Error('Unexpected field order');

    const $rows = $table.find('tbody > tr:not(.sumline)');

    $rows.each((index, row) => {
      const $row = $(row);
      const officialEnglishName = parse.string($row.find('th').text());

      states.push({
        state: this._parseProvince(officialEnglishName),
        cases: parse.number($row.find(`td:nth-child(${this._fieldPositions.cases})`).text()),
        recovered: parse.number($row.find(`td:nth-child(${this._fieldPositions.recovered})`).text()),
        deaths: parse.number($row.find(`td:nth-child(${this._fieldPositions.deaths})`).text()),
        population: this._population[officialEnglishName]
      });
    });

    return states;
  }
};

export default scraper;
