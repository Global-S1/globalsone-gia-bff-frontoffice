import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import {
  IAggregatedResponse,
  IAggregationMeta,
  IPartialFailure,
  IServiceCallResult,
} from "../../domain/interfaces/aggregated-response.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";
import { logger } from "../../../entities/shared/infraestructure/utils/logger";

/**
 * Service call definition for aggregation
 */
export interface IServiceCall<T> {
  /** Unique key for this call in the aggregated response */
  key: string;

  /** Service name (for error reporting) */
  service: string;

  /** The actual service call function */
  call: () => Promise<IServiceResponse<T>>;

  /** Default value if the call fails (enables graceful degradation) */
  fallback?: T;

  /** Whether this call is required (if true, entire aggregation fails on error) */
  required?: boolean;
}

/**
 * Base class for aggregation use cases.
 * Provides parallel execution with partial failure handling.
 */
export abstract class BaseAggregationUseCase<TInput, TOutput> {
  /**
   * Execute the aggregation
   */
  abstract execute(
    input: TInput,
    context: IRequestContext
  ): Promise<IAggregatedResponse<TOutput>>;

  /**
   * Execute multiple service calls in parallel with partial failure handling.
   * Uses Promise.allSettled to ensure all calls complete, even if some fail.
   */
  protected async executeParallel<T extends Record<string, unknown>>(
    calls: IServiceCall<unknown>[],
    context: IRequestContext
  ): Promise<{
    results: T;
    meta: IAggregationMeta;
  }> {
    const startTime = Date.now();
    const partialFailures: IPartialFailure[] = [];
    const results: Record<string, unknown> = {};

    logger.debug("Starting parallel aggregation", {
      correlationId: context.correlationId,
      callCount: calls.length,
      keys: calls.map((c) => c.key),
    });

    // Execute all calls in parallel
    const settledResults = await Promise.allSettled(
      calls.map(async (callDef) => {
        const callStart = Date.now();
        try {
          const response = await callDef.call();
          return {
            ...callDef,
            success: response.success,
            data: response.data,
            error: response.error,
            duration: Date.now() - callStart,
          } as IServiceCallResult<unknown>;
        } catch (error) {
          return {
            ...callDef,
            success: false,
            error: {
              service: callDef.service,
              code: "CALL_ERROR",
              message:
                error instanceof Error ? error.message : "Unknown error",
              affectedData: callDef.key,
            },
            duration: Date.now() - callStart,
          } as IServiceCallResult<unknown>;
        }
      })
    );

    // Process results
    for (let i = 0; i < settledResults.length; i++) {
      const settled = settledResults[i];
      const callDef = calls[i];

      if (settled.status === "fulfilled") {
        const result = settled.value;

        if (result.success && result.data !== undefined) {
          results[callDef.key] = result.data;
        } else {
          // Call failed - use fallback or record partial failure
          if (callDef.fallback !== undefined) {
            results[callDef.key] = callDef.fallback;
          }

          if (result.error) {
            partialFailures.push({
              service: callDef.service,
              code: result.error.code,
              message: result.error.message,
              affectedData: callDef.key,
            });
          }

          // If required call failed, we might want to throw
          if (callDef.required) {
            logger.error("Required service call failed", {
              service: callDef.service,
              key: callDef.key,
              error: result.error,
            });
          }
        }
      } else {
        // Promise rejected (shouldn't happen often due to try-catch above)
        const error = settled.reason;

        if (callDef.fallback !== undefined) {
          results[callDef.key] = callDef.fallback;
        }

        partialFailures.push({
          service: callDef.service,
          code: "PROMISE_REJECTED",
          message: error instanceof Error ? error.message : "Unknown error",
          affectedData: callDef.key,
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.debug("Parallel aggregation completed", {
      correlationId: context.correlationId,
      duration,
      partialFailures: partialFailures.length,
    });

    return {
      results: results as T,
      meta: {
        duration,
        partialFailures,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create a successful aggregated response
   */
  protected success<T>(data: T, meta: IAggregationMeta): IAggregatedResponse<T> {
    return {
      success: true,
      data,
      meta,
    };
  }

  /**
   * Check if there are any critical failures that should fail the entire request
   */
  protected hasCriticalFailure(
    partialFailures: IPartialFailure[],
    criticalKeys: string[]
  ): boolean {
    return partialFailures.some((failure) =>
      criticalKeys.includes(failure.affectedData)
    );
  }
}
