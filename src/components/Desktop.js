import React from 'react';
import { createUseStyles } from 'react-jss';
import Taskbar from './Taskbar';

const useStyles = createUseStyles({
  '@global': {
    '*': {
      boxSizing: 'border-box',
    },
    body: {
      margin: 0,
      padding: 0,
    },
  },
  desktop: {
    cursor: `url(${require('../images/cursor.png')}), auto`,
    backgroundImage: `url(${require('../images/clouds.jpg')})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#008080',
    padding: [12, 0],
    position: 'relative',
  },
});

function Desktop({ children }) {
  const classes = useStyles();

  return (
    <div className={classes.desktop}>
      {children}
      <Taskbar />
    </div>
  );
}

export default Desktop;
