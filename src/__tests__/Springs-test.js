/**
 * @flow
 */

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

    const springValues = [];
    const springVelocities = [];

    spring
      .onUpdate(spring => {
        springValues.push(spring.currentValue);
        springVelocities.push(spring.currentVelocity);
      })
      .start();

    // Run timers for one second
    jest.runTimersToTime(1000 / 60 * 60);

    expect(springValues).toMatchSnapshot();
    expect(springVelocities).toMatchSnapshot();
  });
});
