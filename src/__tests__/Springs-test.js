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

    const realSpringPositions = [];
    const realSpringVelocities = [];

    spring
      .onUpdate(spring => {
        realSpringPositions.push(spring.position);
        realSpringVelocities.push(spring.velocity);
      })
      .start();

    // Run timers for one second (60 frames)
    jest.runTimersToTime(1000 / 60 * 60);

    expect(realSpringPositions).toMatchSnapshot();
    expect(realSpringVelocities).toMatchSnapshot();
  });
});
