import fsMock from 'mock-fs';

let logsTemp = [];
let logMock;

export const mock = config => {
  logMock = jest.spyOn(console, 'log').mockImplementation((...args) => {
    logsTemp.push(args);
  });
  fsMock(config);
};

export const restore = () => {
  logMock.mockRestore();
  fsMock.restore();
  logsTemp.map(el => console.log(...el));
  logsTemp = [];
};
