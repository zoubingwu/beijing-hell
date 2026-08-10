import { useEffect, useState } from 'react';

export function useClock(): Date {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return time;
}
