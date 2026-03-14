export function throttleRAF<T extends (...args: never[]) => void>(fn: T): T {
  let frameId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (frameId === null) {
      frameId = requestAnimationFrame(() => {
        frameId = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      });
    }
  }) as T;

  return throttled;
}

export function throttleMs<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): T {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();

    if (now - lastCallTime >= ms) {
      lastCallTime = now;
      fn(...args);
      lastArgs = null;
    } else if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          timeoutId = null;
          lastCallTime = Date.now();
          if (lastArgs) {
            fn(...lastArgs);
            lastArgs = null;
          }
        },
        ms - (now - lastCallTime),
      );
    }
  }) as T;

  return throttled;
}
