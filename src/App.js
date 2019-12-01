import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Desktop from './components/Desktop';
import ShortCut from './components/ShortCut';
import Game from './components/Game';

function App() {
  const open = useSelector(state => state.events.open);
  const {
    events: { openGame },
  } = useDispatch();

  return (
    <Desktop>
      <ShortCut
        title="北京浮生记"
        iconUrl={require('./images/earth.ico')}
        onDoubleClick={openGame}
      />
      {open && <Game />}
    </Desktop>
  );
}

export default App;
