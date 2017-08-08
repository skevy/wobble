export type SpringConfig = {
  fromValue: number,
  toValue: number,
  stiffness: number,
  damping: number,
  mass: number,
  initialVelocity: number,
  allowsOverdamping: number,
  overshootClamping: boolean,
  restVelocityThreshold: number,
  restDisplacementThreshold: number
};

export type PartialSpringConfig = Partial<SpringConfig>;

export type SpringListener = (spring: Spring) => void;

/**
 * Implements a spring physics simulation based on the equations behind
 * damped harmonic oscillators (https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
 */
export class Spring {
  static MAX_DELTA_TIME_MS: number;

  /**
   * The spring's current position, calculated against `fromValue` and
   * `toValue`.
   */
  readonly position: number;

  /**
   * The spring's current velocity, calculated against `fromValue` and
   * `toValue`, in units / ms.
   */
  readonly velocity: number;

  /**
   * The spring's current position, independent of `fromValue` and `toValue`.
   * If `fromValue` was 0 and `toValue` was 1, this would be the same as
   * `position`.
   */
  readonly normalizedPosition: number;

  /**
   * The spring's current velocity, independent of `fromValue` and `toValue`, in
   * units / ms. If `fromValue` was 0 and `toValue` was 1, this would be the
   * same as `velocity`.
   */
  readonly normalizedVelocity: number;

  constructor(config?: PartialSpringConfig);

  /**
   * If `fromValue` differs from `toValue`, or `initialVelocity` is non-zero,
   * start the simulation and call the `onActive` listeners.
   */
  start(): void;

  /**
   * If a simulation is in progress, stop it and call the `onAtRest` listeners.
   */
  stop(): void;

  /**
   * Updates the spring config with the given values.  Values not explicitly
   * supplied will be reused from the existing config.
   */
  updateConfig(updatedConfig: PartialSpringConfig): void;

  /**
   * The provided callback will be invoked when the simulation begins.
   */
  onActive(listener: SpringListener): Spring;

  /**
   * The provided callback will be invoked on each frame while the simulation is
   * running.
   */
  onUpdate(listener: SpringListener): Spring;

  /**
   * The provided callback will be invoked when the simulation ends.
   */
  onAtRest(listener: SpringListener): Spring;
}
