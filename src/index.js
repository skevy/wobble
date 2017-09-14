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
  onStart?: SpringListenerFn,
  onStop?: SpringListenerFn
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
  _isAnimating: boolean = false;

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
   * start the simulation and call the `onStart` listeners.
   */
  start() {
    const { fromValue, toValue, initialVelocity } = this._config;

    if (fromValue !== toValue || initialVelocity !== 0) {
      this._reset();
      this._isAnimating = true;

      if (!this._currentAnimationStep) {
        this._notifyListeners("onStart");
        this._currentAnimationStep = requestAnimationFrame((t: number) => {
          this._step(t);
        });
      }
    }
  }

  /**
   * If a simulation is in progress, stop it and call the `onStop` listeners.
   */
  stop() {
    if (!this._isAnimating) {
      return;
    }

    this._isAnimating = false;
    this._notifyListeners("onStop");

    if (this._currentAnimationStep) {
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
   * If the spring has reached its `toValue`, or if its velocity is below the
   * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
   * during a simulation, both `isAnimating` and `isAtRest` will be false.
   */
  get isAtRest(): boolean {
    return this._isSpringAtRest();
  }

  /**
   * Whether or not the spring is currently emitting values.
   *
   * Note: this is distinct from whether or not it is at rest.
   * See also `isAtRest`.
   */
  get isAnimating(): boolean {
    return this._isAnimating;
  }

  /**
   * Updates the spring config with the given values.  Values not explicitly
   * supplied will be reused from the existing config.
   */
  updateConfig(updatedConfig: PartialSpringConfig): void {
    // When we update the spring config, we reset the simulation to ensure the
    // spring always moves the full distance between `fromValue` and `toValue`.
    // To ensure that the simulation behaves correctly if those values aren't
    // being changed in `updatedConfig`, we run the simulation with `_step()`
    // and default `fromValue` and `initialVelocity` to their current values.

    this._evaluateSpring(performance.now());

    const baseConfig = {
      fromValue: this._currentValue,
      initialVelocity: this._currentVelocity
    };

    this._config = {
      ...this._config,
      ...baseConfig,
      ...updatedConfig
    };

    this._reset();
  }

  /**
   * The provided callback will be invoked when the simulation begins.
   */
  onStart(listener: SpringListenerFn): Spring {
    this._listeners.push({ onStart: listener });
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
  onStop(listener: SpringListenerFn): Spring {
    this._listeners.push({ onStop: listener });
    return this;
  }

  /**
   * Remove a single listener from this spring.
   */
  removeListener(listenerFn: SpringListenerFn): Spring {
    this._listeners = this._listeners.reduce((result, listener) => {
      const foundListenerFn =
        Object.values(listener).indexOf(listenerFn) !== -1;
      if (!foundListenerFn) {
        result.push(listener);
      }
      return result;
    }, []);
    return this;
  }

  /**
   * Removes all listeners from this spring.
   */
  removeAllListeners(): Spring {
    this._listeners = [];
    return this;
  }

  _reset() {
    this._currentTime = 0.0;
    this._springTime = 0.0;
    this._currentValue = this._config.fromValue;
    this._currentVelocity = this._config.initialVelocity;
  }

  _notifyListeners(eventName: $Keys<SpringListener>) {
    this._listeners.forEach((listener: SpringListener) => {
      const maybeListenerFn = listener[eventName];
      if (typeof maybeListenerFn === "function") {
        maybeListenerFn(this);
      }
    });
  }

  /**
   * `_step` is the main loop.  While the animation is running, it updates the
   * current state once per frame, and schedules the next frame if the spring is
   * not yet at rest.
   */
  _step(timestamp: number) {
    this._evaluateSpring(timestamp);

    // check `_isAnimating`, in case `stop()` got called during
    // `evaluateSpring()`
    if (this._isAnimating) {
      this._currentAnimationStep = requestAnimationFrame((t: number) =>
        this._step(t)
      );
    }
  }

  /**
   * `_evaluateSpring` updates `_currentTime`, `_currentValue`, and
   * `_currentVelocity` to reflect the absolute timestamp provided.
   */
  _evaluateSpring(timestamp: number) {
    // `_evaluateSpring` updates `_currentTime` and triggers the listeners.
    // Because of these side effects, it's only safe to call when an animation
    // is already in-progress.
    if (!this._isAnimating) {
      return;
    }

    const isFirstStep = this._currentTime === 0;
    if (isFirstStep) {
      this._currentTime = timestamp;
    }

    let deltaTime = timestamp - this._currentTime;

    if (deltaTime === 0 && !isFirstStep) {
      return;
    }

    // If for some reason we lost a lot of frames (e.g. process large payload or
    // stopped in the debugger), we only advance by 4 frames worth of
    // computation and will continue on the next frame. It's better to have it
    // running at slower speed than jumping to the end.
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

    this._currentTime = timestamp;
    this._currentValue = oscillation;
    this._currentVelocity = velocity;

    this._notifyListeners("onUpdate");
    if (!this._isAnimating) {
      // a listener might have stopped us in _onUpdate
      return;
    }

    // If the Spring is overshooting (when overshoot clamping is on), or if the
    // spring is at rest (based on the thresholds set in the config), stop the
    // animation.
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
