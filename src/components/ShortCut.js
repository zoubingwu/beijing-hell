import React, { useState, useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import useClickOutside from '../hooks/useClickOutside';

const useStyles = createUseStyles({
  shortcut: {
    margin: [0, 12],
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    backgroundColor: 'transparent',
  },
  icon: {
    height: 32,
    width: 32,
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    lineHeight: '13px',
    userSelect: 'none',
    display: 'block',
    backgroundColor: '#008080',
    position: 'relative',
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    maxHeight: 'calc(13px * 2)',
    width: '100%',
    textAlign: 'center',

    '&.focused': {
      backgroundColor: '#0B239A',
      color: '#fff',
    },

    '&.focused:after': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      border: '1px dotted #ffffff',
      mixBlendMode: 'exclusion',
    },
  },
});

function ShortCut({ title, iconUrl, onDoubleClick }) {
  const classes = useStyles();
  const [focused, setFocused] = useState(false);
  const handleClickOutSide = useCallback(() => {
    setFocused(false);
  }, [setFocused]);
  const handleClick = useCallback(
    e => {
      e.stopPropagation();
      setFocused(true);
    },
    [setFocused]
  );
  const [ref, _] = useClickOutside(handleClickOutSide);

  return (
    <div
      draggable={true}
      ref={ref}
      className={cx(classes.shortcut, focused && 'focused')}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      <img src={iconUrl} className={classes.icon} />
      <div className={cx(classes.title, focused && 'focused')}>{title}</div>
    </div>
  );
}

export default ShortCut;
