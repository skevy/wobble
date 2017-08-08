/** @license
 *  Copyright 2017 Adam Miskiewicz
 *
 *  Use of this source code is governed by a MIT-style license that can be found
 *  in the LICENSE file or at https://opensource.org/licenses/MIT.
 */
// @flow

import { Spring } from "../";

describe("Spring", () => {
  it("successfully animates a spring", () => {
    const spring = new Spring({
      fromValue: 0,
      toValue: 1,
      stiffness: 1000,
      damping: 500,
      mass: 3
    });

    const normalizedSpringPositions = [];
    const normalizedSpringVelocities = [];
    const realSpringPositions = [];
    const realSpringVelocities = [];

    spring
      .onUpdate(spring => {
        normalizedSpringPositions.push(spring.normalizedPosition);
        normalizedSpringVelocities.push(spring.normalizedVelocity);
        realSpringPositions.push(spring.position);
        realSpringVelocities.push(spring.velocity);
      })
      .start();

    // Run timers for one second (60 frames)
    jest.runTimersToTime(1000 / 60 * 60);

    expect(normalizedSpringPositions).toMatchSnapshot();
    expect(normalizedSpringVelocities).toMatchSnapshot();
    expect(realSpringPositions).toMatchSnapshot();
    expect(realSpringVelocities).toMatchSnapshot();
  });
});
