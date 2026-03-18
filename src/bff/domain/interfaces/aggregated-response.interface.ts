/**
 * Information about a partial failure during aggregation
 */
export interface IPartialFailure {
  /** Service that failed */
  service: string;

  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** What data is affected/missing */
  affectedData: string;
}

/**
 * Metadata about the aggregation
 */
export interface IAggregationMeta {
  /** Total duration of the aggregation in milliseconds */
  duration: number;

  /** List of partial failures (empty if all succeeded) */
  partialFailures: IPartialFailure[];

  /** Whether the response came from cache */
  cached?: boolean;

  /** Timestamp when the data was generated */
  timestamp: string;
}

/**
 * Aggregated response from BFF
 */
export interface IAggregatedResponse<T> {
  /** Whether the aggregation was successful (may be true even with partial failures) */
  success: boolean;

  /** Aggregated data */
  data: T;

  /** Aggregation metadata */
  meta: IAggregationMeta;
}

/**
 * Result from a single service call during aggregation
 */
export interface IServiceCallResult<T> {
  /** Service name */
  service: string;

  /** Key to use in the aggregated response */
  key: string;

  /** Whether the call succeeded */
  success: boolean;

  /** Data from the service */
  data?: T;

  /** Error if the call failed */
  error?: IPartialFailure;

  /** Duration of the call */
  duration: number;
}
