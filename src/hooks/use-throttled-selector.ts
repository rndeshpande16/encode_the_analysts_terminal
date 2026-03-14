import { useRef, useState, useEffect } from "react";

export function useThrottledValue<T>(value: T, ms: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdate = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= ms) {
      lastUpdate.current = now;
      setThrottled(value);
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(
        () => {
          timeoutRef.current = null;
          lastUpdate.current = Date.now();
          setThrottled(value);
        },
        ms - (now - lastUpdate.current),
      );
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, ms]);

  return throttled;
}
