import { isFunction, isNil, isPositiveFiniteNumber } from './validate';

export const runFunction = async <T>(fn: () => T | Promise<T>) => {
  await fn();
};

export const runCatchFunction = <T>(fn: () => T, message: string): T => {
  try {
    return fn();
  } catch (error) {
    throw new Error(message, { cause: error });
  }
};

export const runCatchAsyncFunction = async <T>(fn: () => Promise<T>, message: string): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw new Error(message, { cause: error });
  }
};
export const runRetryFunction = <T>(fn: () => T, retry: number = 3, validate?: (result: T) => boolean): T => {
  if (!isPositiveFiniteNumber(retry) || retry <= 0) throw new Error('retry must be a positive finite number');

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retry; attempt++) {
    try {
      const result = fn();

      if (isNil(validate) || !isFunction(validate)) return result;
      if (validate(result)) return result;

      lastError = new Error(`Validation failed on attempt ${attempt}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

export const runRetryAsyncFunction = async <T>(
  fn: () => Promise<T>,
  retry: number = 3,
  validate?: (result: T) => boolean,
): Promise<T> => {
  if (!isPositiveFiniteNumber(retry) || retry <= 0) throw new Error('retry must be a positive finite number');

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retry; attempt++) {
    try {
      const result = await fn();

      if (isNil(validate) || !isFunction(validate)) return result;
      if (validate(result)) return result;

      lastError = new Error(`Validation failed on attempt ${attempt}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('All retry attempts failed');
};
