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
   * The spring's current position.
   */
  readonly currentValue: number;

  /**
   * The spring's current velocity.
   */
  readonly currentVelocity: number;
  
  /**
   * If the spring has reached its toValue, or if its velocity is below the 
   * restVelocityThreshold, it is considered at rest. If stop is called during 
   * a simulation, both isAnimating and isAtRest will be false.
   */
  readonly isAtRest: boolean;
  
  /**
   * Note: this is distinct from whether or not it is at rest. 
   * See also isAtRest.
   */
  readonly isAnimating: boolean;

  constructor(config?: PartialSpringConfig);

  /**
   * If `fromValue` differs from `toValue`, or `initialVelocity` is non-zero,
   * start the simulation and call the `onStart` listeners.
   */
  start(): void;

  /**
   * If a simulation is in progress, stop it and call the `onStop` listeners.
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
  onStart(listener: SpringListener): Spring;

  /**
   * The provided callback will be invoked on each frame while the simulation is
   * running.
   */
  onUpdate(listener: SpringListener): Spring;

  /**
   * The provided callback will be invoked when the simulation ends.
   */
  onStop(listener: SpringListener): Spring;
  
  /**
   * Remove a single listener from this spring.
   */
  removeListener(listener: SpringListener): Spring;
  
  /**
   * Removes all listeners from this spring.
   */
  removeAllListeners(): Spring
}
