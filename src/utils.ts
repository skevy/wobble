/**
 *  @license
 *  Copyright 2017 Adam Miskiewicz
 *
 *  Use of this source code is governed by a MIT-style license that can be found
 *  in the LICENSE file or at https://opensource.org/licenses/MIT.
 */

export function invariant(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function withDefault<X>(maybeValue: X | undefined, defaultValue: X): X {
  return typeof maybeValue !== "undefined" && maybeValue !== null
    ? (maybeValue as X)
    : defaultValue;
}
