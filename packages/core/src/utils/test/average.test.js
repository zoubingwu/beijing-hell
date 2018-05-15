import { expect } from 'chai';
import { average } from '../average';

describe('[util]: average function', function() {
  it('should return correct average int', function() {
    expect(average(2, 4, 2)).to.equal(3);
    expect(average(1, 3, 2)).to.equal(2);
    expect(average(100, 300, 400)).to.equal(1);
    expect(average(1, 1, 2)).to.equal(1);
    expect(average(1, 2, 2)).to.equal(1);
  });
});
