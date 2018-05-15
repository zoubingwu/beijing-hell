
import { expect } from 'chai';

import reducer from './index';
import { changeLocation } from '../../actions';

/* eslint-disable */
describe('[reducer]: location reducer', function() {
  it('should change to correct location', function() {
    const initialState = {
      currentLocation: { id: 1, name: '建国门' },
    };

    const action = changeLocation({ id: 17, name: '菜户营' });

    expect(reducer(initialState, action).currentLocation).to.be.an('object').that.does.deep.equal({ id: 17, name: '菜户营' });
  });
});
