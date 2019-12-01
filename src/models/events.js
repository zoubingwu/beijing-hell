const events = {
  state: {
    open: false,
  },
  updates: (setState, { getState, dispatch }) => {
    const openGame = () => {
      setState(state => {
        state.open = true;
      });
    };
    return {
      openGame,
    };
  },
};

export default events;
