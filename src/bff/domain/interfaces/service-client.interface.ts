import { IRequestContext } from "./request-context.interface";
import { IServiceResponse } from "./service-response.interface";

/**
 * HTTP methods supported by service clients
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Configuration for a backend service
 */
export interface IServiceConfig {
  /** Service name for identification */
  name: string;

  /** Base URL of the service */
  baseUrl: string;

  /** Request timeout in milliseconds */
  timeout: number;

  /** Number of retries on failure */
  retries: number;

  /** Health check endpoint path */
  healthPath: string;
}

/**
 * Options for a service request
 */
export interface IServiceRequestOptions {
  /** HTTP method */
  method: HttpMethod;

  /** Request path (relative to baseUrl) */
  path: string;

  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>;

  /** Request body (for POST, PUT, PATCH) */
  body?: unknown;

  /** Additional headers */
  headers?: Record<string, string>;

  /** Override default timeout */
  timeout?: number;

  /** Override default retries */
  retries?: number;
}

/**
 * Interface for service clients
 */
export interface IServiceClient {
  /** Service name */
  readonly serviceName: string;

  /** Service configuration */
  readonly config: IServiceConfig;

  /**
   * Make a request to the backend service
   */
  request<T>(
    options: IServiceRequestOptions,
    context: IRequestContext
  ): Promise<IServiceResponse<T>>;

  /**
   * Check if the service is healthy
   */
  healthCheck(): Promise<boolean>;
}
