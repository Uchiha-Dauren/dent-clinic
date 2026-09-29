import { useState, useEffect } from 'react';
import { getOpenStatus } from '../lib/time';
export function useOpenStatus() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return getOpenStatus(now);
}