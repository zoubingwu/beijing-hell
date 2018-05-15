import { expect } from 'chai';
import { random } from '../random';

describe('[util]: random function', function() {
  it('should return number type', function() {
    expect(random(20)).to.be.a('number');
  });

  it('should return a int', function() {
    expect(random(10) % 1).to.equal(0);
    expect(random(50) % 1).to.equal(0);
    expect(random(100) % 1).to.equal(0);
  });

  it('should be within given range', function() {
    const result1 = random(50);
    expect(result1).to.be.within(0, 50);

    const result2 = random(100);
    expect(result2).to.be.within(0, 100);

    const result3 = random(1, 100);
    expect(result3).to.be.within(1, 100);

    const result4 = random(50, 100);
    expect(result4).to.be.within(50, 100);
  });
});
