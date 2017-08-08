/**
 * @flow
 */

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
  _currentAnimationStep: number; // current requestAnimationFrame

  _currentTime: number = 0; // Current timestamp of animation in ms (real time)
  _springTime: number = 0; // Current time along the spring curve in ms (zero-based)
  _isAnimating: boolean = false;

  _currentNormalizedPosition: number = 0; // the current value of the spring
  _currentNormalizedVelocity: number = 0; // the current velocity of the spring
  _springAtRest: boolean = true;

  _oscillationVelocityPairs = [];

  constructor(config: PartialSpringConfig = {}) {
    this._config = {
      fromValue: withDefault(config.fromValue, 0),
      toValue: withDefault(config.toValue, 0),
      stiffness: withDefault(config.stiffness, 100),
      damping: withDefault(config.damping, 10),
      mass: withDefault(config.mass, 1),
      initialVelocity: 0,
      overshootClamping: withDefault(config.overshootClamping, false),
      allowsOverdamping: withDefault(config.allowsOverdamping, false),
      restVelocityThreshold: withDefault(config.restVelocityThreshold, 0.001),
      restDisplacementThreshold: withDefault(
        config.restDisplacementThreshold,
        0.001
      )
    };
    this._config.initialVelocity = this._normalizeVelocity(
      withDefault(config.initialVelocity, 0)
    );
  }

  /**
   * If `fromValue` differs from `toValue`, or `initialVelocity` is non-zero,
   * start the simulation and call the `onActive` listeners.
   */
  start() {
    const { fromValue, toValue, initialVelocity } = this._config;

    if (fromValue !== toValue || initialVelocity !== 0) {
      this._springTime = 0.0;
      this._springAtRest = false;
      this._isAnimating = true;
      if (!this._currentAnimationStep) {
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
    if (!this._isAnimating) {
      return;
    }

    this._notifyListeners("onAtRest");
    this._isAnimating = false;

    if (this._currentAnimationStep) {
      cancelAnimationFrame(this._currentAnimationStep);
      this._currentAnimationStep = undefined;
    }
  }

  /**
   * The spring's current position, calculated against `fromValue` and
   * `toValue`.
   */
  get position(): number {
    // Lerp the value + velocity over the animation's start/end values
    const scaleFactor = this._config.toValue - this._config.fromValue;
    return this._config.fromValue + this.normalizedPosition * scaleFactor;
  }

  /**
   * The spring's current velocity, calculated against `fromValue` and
   * `toValue`, in units / ms.
   */
  get velocity(): number {
    // invert and then scale the velocity over the animation's start/end values
    const scaleFactor = this._config.toValue - this._config.fromValue;
    return this.normalizedVelocity * scaleFactor; // give velocity in units/ms;
  }

  /**
   * The spring's current position, independent of `fromValue` and `toValue`.
   * If `fromValue` was 0 and `toValue` was 1, this would be the same as
   * `position`.
   */
  get normalizedPosition(): number {
    return this._currentNormalizedPosition;
  }

  /**
   * The spring's current velocity, independent of `fromValue` and `toValue`, in
   * units / ms. If `fromValue` was 0 and `toValue` was 1, this would be the
   * same as `velocity`.
   */
  get normalizedVelocity(): number {
    return this._currentNormalizedVelocity;
  }

  /**
   * Updates the spring config with the given values.  Values not explicitly
   * supplied will be reused from the existing config.
   */
  updateConfig(updatedConfig: PartialSpringConfig): void {
    // `spring.start()` will reset the time to 0.  Record its current position
    // before that happens.
    this._config.fromValue = this.position;

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
    if (this._isAnimating && !this._springAtRest) {
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
    // invert the initial velocity, as we expect our spring has an x0 of 1
    const v0 = -this._config.initialVelocity;

    invariant(m > 0, "Mass value must be greater than 0");
    invariant(k > 0, "Stiffness value must be greater than 0");
    invariant(c > 0, "Damping value must be greater than 0");

    let zeta = c / (2 * Math.sqrt(k * m)); // damping ratio (dimensionless)
    const omega0 = Math.sqrt(k / m) / 1000; // undamped angular frequency of the oscillator (rad/ms)
    const omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta); // exponential decay
    const omega2 = omega0 * Math.sqrt(zeta * zeta - 1.0); // frequency of damped oscillation
    const x0 = 1; // calculate the oscillation from x0 = 1 to x = 0

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
        1 -
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
      oscillation = 1 - envelope * (x0 + (v0 + omega0 * x0) * t);
      velocity =
        envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
    } else {
      // Overdamped
      const envelope = Math.exp(-zeta * omega0 * t);
      oscillation =
        1 -
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

    this._currentNormalizedPosition = oscillation;
    this._currentNormalizedVelocity = velocity;

    this._notifyListeners("onUpdate");
    if (!this._isAnimating) {
      // a listener might have stopped us in _onUpdate
      return;
    }

    // If the Spring is overshooting (when overshoot clamping is on),
    // or if the spring is at rest (based on the thresholds set in the config),
    // stop the animation
    if (
      this._isSpringOvershooting(oscillation) ||
      this._isSpringAtRest(oscillation, velocity)
    ) {
      if (k !== 0) {
        // Ensure that we end up with a round value
        this._currentNormalizedPosition = 1;
        this._currentNormalizedVelocity = 0;
        this._notifyListeners("onUpdate");
      }

      this._springAtRest = true;
      this.stop();
      return;
    }
  }

  _isSpringOvershooting(oscillation: number) {
    const { stiffness, overshootClamping } = this._config;
    let isOvershooting = false;
    if (overshootClamping && stiffness !== 0) {
      isOvershooting = oscillation > 1;
    }
    return isOvershooting;
  }

  _isSpringAtRest(oscillation: number, velocity: number) {
    const {
      stiffness,
      restDisplacementThreshold,
      restVelocityThreshold
    } = this._config;

    const isVelocity = Math.abs(velocity) <= restVelocityThreshold;
    const isDisplacement =
      stiffness !== 0 && Math.abs(1 - oscillation) <= restDisplacementThreshold;
    return isDisplacement && isVelocity;
  }

  _normalizeVelocity(velocity: number): number {
    const scaleFactor = this._config.toValue - this._config.fromValue;
    return Math.abs(scaleFactor) > 0 ? velocity / scaleFactor : 0;
  }
}
