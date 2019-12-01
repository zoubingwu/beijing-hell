import React from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  window: {
    position: 'fixed',
    left: 'calc(50% - 300px)',
    top: 'calc(50% - 240px)',
    width: 600,
    height: 480,
    borderLeftColor: 'rgb(255, 255, 255)',
    borderTopColor: 'rgb(255, 255, 255)',
    borderRightColor: 'rgb(5, 6, 8)',
    borderBottomColor: 'rgb(5, 6, 8)',
    boxShadow:
      'rgba(0, 0, 0, 0.35) 4px 4px 10px 0px, rgb(223, 224, 227) 1px 1px 0px 1px inset, rgb(136, 140, 143) -1px -1px 0px 1px inset',
    boxSizing: 'border-box',
    display: 'inline-block',
    backgroundColor: 'rgb(206, 208, 207)',
    color: 'rgb(5, 6, 8)',
    padding: 2,
    borderStyle: 'solid',
    borderWidth: 2,
  },
});

function Game() {
  const classes = useStyles();
  return <div className={classes.window}></div>;
}

export default Game;
