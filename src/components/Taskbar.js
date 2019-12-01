import React, { useState, useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import useTime from '../hooks/useTime';

const useStyles = createUseStyles({
  taskbar: {
    outline: '1px solid #c0c0c0',
    borderTop: '1px solid white',
    background: '#c0c0c0',
    position: 'absolute',
    zIndex: 2,
    bottom: 0,
    left: 0,
    right: 0,
    height: 27,
    display: 'flex',
  },
  button: {
    padding: [2, 4],
    lineHeight: '14px',
    overflow: 'hidden',
    display: 'flex',
    margin: 2,
    flexDirection: 'row',
    alignItems: 'center',
    verticalAlign: 'middle',
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    background: '#c0c0c0',
    borderTop: '1px solid #fff',
    borderLeft: '1px solid #fff',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    position: 'relative',
    outline: 0,
    '&:after': {
      content: '""',
      pointerEvents: 'none',
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      borderTop: '1px solid #dfdfdf',
      borderLeft: '1px solid #dfdfdf',
      borderRight: '1px solid #808080',
      borderBottom: '1px solid #808080',
    },
  },
  divider: {
    borderLeft: '1px solid #707070',
    borderRight: '1px solid white',
    margin: [2, 0],
  },
  tasks: {
    display: 'flex',
    flex: 1,
    height: '100%',
  },
  tray: {
    boxShadow: '1px 1px 0 #707070 inset, -1px -1px 0 white inset',
    display: 'flex',
    flexDirection: 'row',
    lineHeight: '22px',
    boxSizing: 'border-box',
    verticalAlign: 'middle',
    margin: 2,
  },
  time: {
    width: 50,
    textAlign: 'center',
    fontSize: 12,
  },
});

function Taskbar() {
  const classes = useStyles();
  const t = useTime();

  return (
    <div className={classes.taskbar}>
      <button className={classes.button}>
        <img src={require('../images/start.png')} />
        <b>Start</b>
      </button>
      <div className={classes.divider} />
      <div className={classes.tasks}></div>
      <div className={classes.divider} />
      <div className={classes.tray}>
        <div className={classes.time} title={t.toString()}>
          {t.toClockString()}
        </div>
      </div>
    </div>
  );
}

export default Taskbar;
