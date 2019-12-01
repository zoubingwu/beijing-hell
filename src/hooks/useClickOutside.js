import { useState, useRef, useEffect } from 'react';

export default function useClickOutside(handler) {
  const ref = useRef(null);
  const [state, setState] = useState({
    hasClickedOutside: false,
  });

  useEffect(() => {
    const listener = event => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        setState({ hasClickedOutside: false });
        return;
      }

      setState({ hasClickedOutside: true });
      handler(event);
    };

    if (window.PointerEvent) {
      document.addEventListener('pointerdown', listener);
    } else {
      document.addEventListener('mousedown', listener);
      document.addEventListener('touchstart', listener);
    }

    return () => {
      if (window.PointerEvent) {
        document.addEventListener('pointerdown', listener);
      } else {
        document.removeEventListener('mousedown', listener);
        document.removeEventListener('touchstart', listener);
      }
    };
  }, []);

  return [ref, state.hasClickedOutside];
}
