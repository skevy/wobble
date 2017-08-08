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

export class Spring {
  static MAX_DELTA_TIME_MS: number;

  readonly position: number;
  readonly velocity: number;
  readonly normalizedPosition: number;
  readonly normalizedVelocity: number;

  constructor(config?: PartialSpringConfig);

  start(): void;
  stop(): void;

  updateConfig(updatedConfig: PartialSpringConfig): void;

  onUpdate(listener: SpringListener): Spring;
  onAtRest(listener: SpringListener): Spring;
}
