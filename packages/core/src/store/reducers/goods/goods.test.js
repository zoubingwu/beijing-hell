import { expect } from 'chai';

import reducer from './index';
import { buyGoods, sellGoods } from '../../actions';

/* eslint-disable */
describe('[reducer]: goods reducer', function() {
  it('should push correct data into current goods', function() {
    const initalState = {
      currentOwnGoods: [],
    };

    const action = buyGoods({
      id: 1,
      name: 'xxx',
      price: 20,
      quantity: 100,
    });

    expect(reducer(initalState, action).currentOwnGoods)
      .to.be.an('array')
      .that.does.deep.include({
        id: 1,
        name: 'xxx',
        price: 20,
        quantity: 100,
      });
  });

  it('should merge correct data into current goods', function() {
    const initalState = {
      currentOwnGoods: [
        {
          id: 1,
          name: 'xxx',
          price: 20,
          quantity: 100,
        },
      ],
    };

    const action = buyGoods({
      id: 1,
      name: 'xxx',
      price: 30,
      quantity: 100,
    });

    expect(reducer(initalState, action).currentOwnGoods)
      .to.be.an('array')
      .that.does.deep.include({
        id: 1,
        name: 'xxx',
        price: 25,
        quantity: 200,
      });
  });

  it('should have correct quantity after sell', function() {
    const initalState = {
      currentOwnGoods: [
        {
          id: 1,
          name: 'xxx',
          price: 20,
          quantity: 100,
        },
      ],
    };

    const action = sellGoods({ id: 1, quantity: 50 });

    expect(reducer(initalState, action).currentOwnGoods)
      .to.be.an('array')
      .that.does.deep.include({
        id: 1,
        name: 'xxx',
        price: 20,
        quantity: 50,
      });
  });
});
