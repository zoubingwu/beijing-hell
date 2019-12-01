import { useState, useEffect, useMemo } from 'react';

export default function useTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, []);

  const clockString = useMemo(() => {
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [time]);

  const string = useMemo(() => time.toString(), [time]);

  return {
    toString: () => string,
    toClockString: () => clockString,
  };
}
