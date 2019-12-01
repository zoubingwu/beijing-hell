const initialState = {
  currentDay: 0,
  totalDay: 39,
};

const time = {
  state: initialState,
  updates: setState => {
    increment: () => {
      setState(state => {
        state.currentDay++;
      });
    };
  },
};

export default time;
