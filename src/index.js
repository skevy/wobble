/**
 * @flow
 */

import invariant from "invariant";

/**
 * Implements a spring physics simulation based on the equations behind
 * damped harmonic oscillators (https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
 */

type SpringConfig = {
  fromValue?: number, // Starting value of the animation.
  toValue?: number, // Ending value of the animation.
  stiffness?: number, // The spring stiffness coefficient.
  damping?: number, // Defines how the spring’s motion should be damped due to the forces of friction.
  mass?: number, // The mass of the object attached to the end of the spring.
  initialVelocity?: number, // The initial velocity (in px/ms) of the object attached to the spring.
  overshootClamping?: boolean,
  restVelocityThreshold?: number,
  restDisplacementThreshold?: number
};

type ConcreteSpringConfig = $ObjMap<SpringConfig, <V>(V) => $NonMaybeType<V>>;

type SpringListenerFn = (spring: Spring) => void;
type SpringListener = {
  onUpdate?: SpringListenerFn,
  onSpringAtRest?: SpringListenerFn
};

function withDefault<X>(maybeValue: ?X, defaultVal: X): X {
  return typeof maybeValue !== "undefined"
    ? ((maybeValue: any): X)
    : defaultVal;
}

export class Spring {
  static MAX_DELTA_TIME_MS = 1 / 60 * 1000 * 4; // advance 4 frames at max

  _config: ConcreteSpringConfig;
  _listeners: Array<SpringListener> = [];
  _currentAnimationStep: number; // current requestAnimationFrame

  _currentTime: number = 0; // Current timestamp of animation in ms
  _springTime: number = 0; // Current timestamp along the spring curve in sec
  _isAnimating: boolean = false;

  _currentSpringValue: number = 0; // the current value of the spring
  _currentSpringVelocity: number = 0; // the current velocity of the spring
  _springAtRest: boolean = true;

  constructor(config: SpringConfig) {
    this._config = {
      fromValue: withDefault(config.fromValue, 0),
      toValue: withDefault(config.toValue, 1),
      stiffness: withDefault(config.stiffness, 100),
      damping: withDefault(config.damping, 10),
      mass: withDefault(config.mass, 1),
      initialVelocity: withDefault(config.initialVelocity, 0) * 1000,
      overshootClamping: withDefault(config.overshootClamping, false),
      restVelocityThreshold: withDefault(config.restVelocityThreshold, 0.001),
      restDisplacementThreshold: withDefault(
        config.restDisplacementThreshold,
        0.001
      )
    };
  }

  start() {
    this._springAtRest = false;
    this._isAnimating = true;
    this._currentAnimationStep = requestAnimationFrame((t: number) => {
      this._step(t);
    });
  }

  stop() {
    if (!this._isAnimating) {
      return;
    }

    this._isAnimating = false;
    if (!this._currentAnimationStep) {
      cancelAnimationFrame(this._currentAnimationStep);
    }
  }

  get currentValue(): number {
    return this._currentSpringValue;
  }

  get currentVelocity(): number {
    return this._currentSpringVelocity / 1000; // give velocity in px/ms;
  }

  onUpdate(listener: SpringListenerFn): Spring {
    this._listeners.push({ onUpdate: listener });
    return this;
  }

  onSpringAtRest(listener: SpringListenerFn): Spring {
    this._listeners.push({ onSpringAtRest: listener });
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
    this._evaluateSpringAtTime(deltaTime);

    this._currentTime = timestamp;
    if (this._isAnimating && !this._springAtRest) {
      this._currentAnimationStep = requestAnimationFrame((t: number) =>
        this._step(t)
      );
    }
  }

  _evaluateSpringAtTime(deltaTime: number) {
    // If for some reason we lost a lot of frames (e.g. process large payload or
    // stopped in the debugger), we only advance by 4 frames worth of
    // computation and will continue on the next frame. It's better to have it
    // running at faster speed than jumping to the end.
    if (deltaTime > Spring.MAX_DELTA_TIME_MS) {
      deltaTime = Spring.MAX_DELTA_TIME_MS;
    }
    this._springTime += deltaTime / 1000;

    const c = this._config.damping;
    const m = this._config.mass;
    const k = this._config.stiffness;
    const v0 = this._config.initialVelocity;
    const fromValue = this._config.fromValue;
    const toValue = this._config.toValue;

    invariant(m > 0, "Mass value must be greater than 0");
    invariant(k > 0, "Stiffness value must be greater than 0");
    invariant(c > 0, "Damping value must be greater than 0");

    const zeta = c / (2 * Math.sqrt(k * m)); // damping ratio
    const omega0 = Math.sqrt(k / m); // undamped angular frequency of the oscillator
    const omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta); // exponential decay
    const x0 = 1; // calculate the oscillation from x0 = 1 to x = 0

    let oscillation = 0.0;
    let velocity = 0.0;
    const t = this._springTime;
    if (zeta < 1) {
      // Under damped
      const envelope = Math.exp(-zeta * omega0 * t);
      oscillation =
        envelope *
        ((v0 + zeta * omega0 * x0) / omega1 * Math.sin(omega1 * t) +
          x0 * Math.cos(omega1 * t));
      // This looks crazy -- it's actually just the derivative of the
      // oscillation function
      velocity =
        envelope *
          (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) -
            omega1 * x0 * Math.sin(omega1 * t)) -
        zeta *
          omega0 *
          envelope *
          (Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 +
            x0 * Math.cos(omega1 * t));
    } else {
      // Critically damped
      let envelope = Math.exp(-omega0 * t);
      oscillation = envelope * (x0 + (v0 + omega0 * x0) * t);
      velocity = envelope * (t * v0 * omega0 - t * x0 * (omega0 * omega0) + v0);
    }

    const delta = toValue - fromValue;
    const fraction = 1 - oscillation;
    const newValue = fromValue + fraction * delta;

    this._currentSpringValue = newValue;
    this._currentSpringVelocity = velocity;

    this._notifyListeners("onUpdate");
    if (!this._isAnimating) {
      // a listener might have stopped us in _onUpdate
      return;
    }

    // If the Spring is overshooting (when overshoot clamping is on),
    // or if the spring is at rest (based on the thresholds set in the config),
    // stop the animation
    if (this._isSpringOvershooting() || this._isSpringAtRest()) {
      if (k !== 0) {
        // Ensure that we end up with a round value
        this._currentSpringValue = toValue;
        this._notifyListeners("onUpdate");
      }

      this._springAtRest = true;
      this._notifyListeners("onSpringAtRest");
      return;
    }
  }

  _isSpringOvershooting() {
    const { stiffness, fromValue, toValue, overshootClamping } = this._config;
    let isOvershooting = false;
    if (overshootClamping && stiffness !== 0) {
      if (fromValue < toValue) {
        isOvershooting = this._currentSpringValue > toValue;
      } else {
        isOvershooting = this._currentSpringValue < toValue;
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

    const isVelocity =
      Math.abs(this._currentSpringVelocity) <= restVelocityThreshold;
    const isDisplacement =
      stiffness !== 0 &&
      Math.abs(toValue - this._currentSpringValue) <= restDisplacementThreshold;
    return isDisplacement && isVelocity;
  }
}
