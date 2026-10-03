// from https://github.com/bameyrick/throttle-typescript

/* eslint-disable @typescript-eslint/no-this-alias */
export type ThrottledFunction<T extends (...args: any) => any> = (...args: Parameters<T>) => ReturnType<T>;

/**
 * Creates a throttled function that only invokes the provided function (`func`) at most once per within a given number of milliseconds
 * (`limit`)
 */
export function throttle<T extends (...args: any) => any>(func: T, limit: number): ThrottledFunction<T> {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function (this: any): ReturnType<T> {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    const context = this;

    if (!inThrottle) {
      inThrottle = true;

      setTimeout(() => (inThrottle = false), limit);

      lastResult = func.apply(context, args as any);
    }

    return lastResult;
  };
}

export function throttleWithTrailing<T extends (...args: any[]) => any>(func: T, limit: number): ThrottledFunction<T> {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastContext: any;
  let lastResult: ReturnType<T>;

  function invoke() {
    if (lastArgs) {
      lastResult = func.apply(lastContext, lastArgs);
      lastArgs = null;
      lastContext = null;
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          invoke(); // call again if new args arrived during wait
        }
      }, limit);
    } else {
      inThrottle = false;
    }
  }

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          invoke();
        }
      }, limit);
    } else {
      lastArgs = args;
      lastContext = this;
    }

    return lastResult;
  };
}
