/** @license
 *  Copyright 2017 Adam Miskiewicz
 *
 *  Use of this source code is governed by a MIT-style license that can be found
 *  in the LICENSE file or at https://opensource.org/licenses/MIT.
 */
// @flow

import { invariant, withDefault } from "./utils";

type SpringConfig = {
  fromValue: number, // Starting value of the animation.
  toValue: number, // Ending value of the animation.
  stiffness: number, // The spring stiffness coefficient.
  damping: number, // Defines how the spring’s motion should be damped due to the forces of friction.
  mass: number, // The mass of the object attached to the end of the spring.
  initialVelocity: number, // The initial velocity (in units/ms) of the object attached to the spring.
  allowsOverdamping: boolean,
  overshootClamping: boolean,
  restVelocityThreshold: number,
  restDisplacementThreshold: number
};

type PartialSpringConfig = $Shape<SpringConfig>;

type SpringListenerFn = (spring: Spring) => void;
type SpringListener = {
  onUpdate?: SpringListenerFn,
  onActive?: SpringListenerFn,
  onAtRest?: SpringListenerFn
};

/**
 * Implements a spring physics simulation based on the equations behind
 * damped harmonic oscillators (https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
 */
export class Spring {
  static MAX_DELTA_TIME_MS = 1 / 60 * 1000 * 4; // advance 4 frames at max

  _config: SpringConfig;
  _listeners: Array<SpringListener> = [];
  _currentAnimationStep: number = 0; // current requestAnimationFrame

  _currentTime: number = 0; // Current timestamp of animation in ms (real time)
  _springTime: number = 0; // Current time along the spring curve in ms (zero-based)

  _currentValue: number = 0; // the current value of the spring
  _currentVelocity: number = 0; // the current velocity of the spring
  _springAtRest: boolean = true;

  _oscillationVelocityPairs = [];

  constructor(config: PartialSpringConfig = {}) {
    this._config = {
      fromValue: withDefault(config.fromValue, 0),
      toValue: withDefault(config.toValue, 0),
      stiffness: withDefault(config.stiffness, 100),
      damping: withDefault(config.damping, 10),
      mass: withDefault(config.mass, 1),
      initialVelocity: withDefault(config.initialVelocity, 0),
      overshootClamping: withDefault(config.overshootClamping, false),
      allowsOverdamping: withDefault(config.allowsOverdamping, false),
      restVelocityThreshold: withDefault(config.restVelocityThreshold, 0.001),
      restDisplacementThreshold: withDefault(
        config.restDisplacementThreshold,
        0.001
      )
    };
  }

  /**
   * If `fromValue` differs from `toValue`, or `initialVelocity` is non-zero,
   * start the simulation and call the `onActive` listeners.
   */
  start() {
    const { fromValue, toValue, initialVelocity } = this._config;

    if (fromValue !== toValue || initialVelocity !== 0) {
      this._currentTime = 0.0;
      this._springTime = 0.0;
      this._currentValue = fromValue;
      this._currentVelocity = initialVelocity;
      this._springAtRest = false;

      if (this._currentAnimationStep === 0) {
        this._currentAnimationStep = requestAnimationFrame((t: number) => {
          this._notifyListeners("onActive");
          this._step(t);
        });
      }
    }
  }

  /**
   * If a simulation is in progress, stop it and call the `onAtRest` listeners.
   */
  stop() {
    if (this._springAtRest) {
      return;
    }

    this._notifyListeners("onAtRest");
    this._springAtRest = true;

    if (this._currentAnimationStep !== 0) {
      cancelAnimationFrame(this._currentAnimationStep);
      this._currentAnimationStep = 0;
    }
  }

  /**
   * The spring's current position.
   */
  get currentValue(): number {
    return this._currentValue;
  }

  /**
   * The spring's current velocity in units / ms.
   */
  get currentVelocity(): number {
    return this._currentVelocity; // give velocity in units/ms;
  }

  /**
   * Updates the spring config with the given values.  Values not explicitly
   * supplied will be reused from the existing config.
   */
  updateConfig(updatedConfig: PartialSpringConfig): void {
    // `spring.start()` will reset the time to 0.  If there's currently a
    // simulation happening, we should ensure that `fromValue` is updated before
    // the spring is reset.  However, if the caller has explicitly set
    // `fromValue`, we should reset the spring's position to ensure it doesn't
    // get clobbered.
    if (updatedConfig.hasOwnProperty("fromValue")) {
      this._currentPosition = 0;
    }

    this._config = {
      ...this._config,
      ...updatedConfig
    };

    this.start();
  }

  /**
   * The provided callback will be invoked when the simulation begins.
   */
  onActive(listener: SpringListenerFn): Spring {
    this._listeners.push({ onActive: listener });
    return this;
  }

  /**
   * The provided callback will be invoked on each frame while the simulation is
   * running.
   */
  onUpdate(listener: SpringListenerFn): Spring {
    this._listeners.push({ onUpdate: listener });
    return this;
  }

  /**
   * The provided callback will be invoked when the simulation ends.
   */
  onAtRest(listener: SpringListenerFn): Spring {
    this._listeners.push({ onAtRest: listener });
    return this;
  }

  _notifyListeners(eventName: $Keys<SpringListener>) {
    this._listeners.forEach((listener: SpringListener) => {
      const maybeListenerFn = listener[eventName];
      if (typeof maybeListenerFn === "function") {
        maybeListenerFn(this);
      }
    });
  }

  _step(timestamp: number) {
    if (!this._currentTime) {
      this._currentTime = timestamp;
    }

    const deltaTime = timestamp - this._currentTime;
    this._evaluateSpring(deltaTime);

    this._currentTime = timestamp;
    if (!this._springAtRest) {
      this._currentAnimationStep = requestAnimationFrame((t: number) =>
        this._step(t)
      );
    }
  }

  _evaluateSpring(deltaTime: number) {
    // If for some reason we lost a lot of frames (e.g. process large payload or
    // stopped in the debugger), we only advance by 4 frames worth of
    // computation and will continue on the next frame. It's better to have it
    // running at faster speed than jumping to the end.
    if (deltaTime > Spring.MAX_DELTA_TIME_MS) {
      deltaTime = Spring.MAX_DELTA_TIME_MS;
    }
    this._springTime += deltaTime;

    const c = this._config.damping;
    const m = this._config.mass;
    const k = this._config.stiffness;
    const fromValue = this._config.fromValue;
    const toValue = this._config.toValue;
    const v0 = -this._config.initialVelocity;

    invariant(m > 0, "Mass value must be greater than 0");
    invariant(k > 0, "Stiffness value must be greater than 0");
    invariant(c > 0, "Damping value must be greater than 0");

    let zeta = c / (2 * Math.sqrt(k * m)); // damping ratio (dimensionless)
    const omega0 = Math.sqrt(k / m) / 1000; // undamped angular frequency of the oscillator (rad/ms)
    const omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta); // exponential decay
    const omega2 = omega0 * Math.sqrt(zeta * zeta - 1.0); // frequency of damped oscillation
    const x0 = toValue - fromValue; // initial displacement of the spring at t = 0

    if (zeta > 1 && !this._config.allowsOverdamping) {
      zeta = 1;
    }

    let oscillation = 0.0;
    let velocity = 0.0;
    const t = this._springTime;
    if (zeta < 1) {
      // Under damped
      const envelope = Math.exp(-zeta * omega0 * t);
      oscillation =
        toValue -
        envelope *
          ((v0 + zeta * omega0 * x0) / omega1 * Math.sin(omega1 * t) +
            x0 * Math.cos(omega1 * t));
      // This looks crazy -- it's actually just the derivative of the
      // oscillation function
      velocity =
        zeta *
          omega0 *
          envelope *
          (Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 +
            x0 * Math.cos(omega1 * t)) -
        envelope *
          (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) -
            omega1 * x0 * Math.sin(omega1 * t));
    } else if (zeta === 1) {
      // Critically damped
      const envelope = Math.exp(-omega0 * t);
      oscillation = toValue - envelope * (x0 + (v0 + omega0 * x0) * t);
      velocity =
        envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
    } else {
      // Overdamped
      const envelope = Math.exp(-zeta * omega0 * t);
      oscillation =
        toValue -
        envelope *
          ((v0 + zeta * omega0 * x0) * Math.sinh(omega2 * t) +
            omega2 * x0 * Math.cosh(omega2 * t)) /
          omega2;
      velocity =
        envelope *
          zeta *
          omega0 *
          (Math.sinh(omega2 * t) * (v0 + zeta * omega0 * x0) +
            x0 * omega2 * Math.cosh(omega2 * t)) /
          omega2 -
        envelope *
          (omega2 * Math.cosh(omega2 * t) * (v0 + zeta * omega0 * x0) +
            omega2 * omega2 * x0 * Math.sinh(omega2 * t)) /
          omega2;
    }

    this._currentValue = oscillation;
    this._currentVelocity = velocity;

    this._notifyListeners("onUpdate");
    if (this._springAtRest) {
      // a listener might have stopped us in _onUpdate
      return;
    }

    // If the Spring is overshooting (when overshoot clamping is on),
    // or if the spring is at rest (based on the thresholds set in the config),
    // stop the animation
    if (this._isSpringOvershooting() || this._isSpringAtRest()) {
      if (k !== 0) {
        // Ensure that we end up with a round value
        this._currentValue = toValue;
        this._currentVelocity = 0;
        this._notifyListeners("onUpdate");
      }

      this.stop();
      return;
    }
  }

  _isSpringOvershooting() {
    const { stiffness, fromValue, toValue, overshootClamping } = this._config;
    let isOvershooting = false;
    if (overshootClamping && stiffness !== 0) {
      if (fromValue < toValue) {
        isOvershooting = this._currentValue > toValue;
      } else {
        isOvershooting = this._currentValue < toValue;
      }
    }
    return isOvershooting;
  }

  _isSpringAtRest() {
    const {
      stiffness,
      toValue,
      restDisplacementThreshold,
      restVelocityThreshold
    } = this._config;

    const isNoVelocity =
      Math.abs(this._currentVelocity) <= restVelocityThreshold;
    const isNoDisplacement =
      stiffness !== 0 &&
      Math.abs(toValue - this._currentValue) <= restDisplacementThreshold;
    return isNoDisplacement && isNoVelocity;
  }
}
