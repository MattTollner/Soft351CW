const assert = require('chai').assert;
const io = require('socket.io-client');

describe('NumbersList', () => {
  let listUnderTest = null;

  beforeEach(() => {
    listUnderTest = new NumberList();
  });

  describe('After Init', () => {
    it('should sum to 0', () => {
        expect(listUnderTest.sumAll()).to.equal(0);
    })
  })
});