/**
 * Response from a backend service call
 */
export interface IServiceResponse<T> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data (if successful) */
  data?: T;

  /** Error information (if failed) */
  error?: IServiceError;

  /** HTTP status code */
  statusCode: number;

  /** Response headers */
  headers?: Record<string, string>;

  /** Duration of the request in milliseconds */
  duration: number;
}

/**
 * Error information from a service call
 */
export interface IServiceError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Service that produced the error */
  service: string;

  /** Original error details (for debugging) */
  details?: unknown;
}
