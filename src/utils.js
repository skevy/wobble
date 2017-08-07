/**
 * @flow
 */

export function invariant(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function withDefault<X>(maybeValue: ?X, defaultValue: X): X {
  return typeof maybeValue !== "undefined"
    ? ((maybeValue: any): X)
    : defaultValue;
}
