import pino, { Logger } from "pino";
import { env } from "../config/environments";
import { STAGE } from "../config/enum/enums";

/**
 * Centralized logger using Pino for high-performance structured logging.
 *
 * Features:
 * - JSON output in production for log aggregation (ELK, CloudWatch, etc.)
 * - Pretty-printed output in development for readability
 * - Automatic redaction of sensitive fields
 * - Context-aware child loggers
 */

// Check if we're in production (either by STAGE env or NODE_ENV)
const isProduction =
  env.stage === STAGE.PROD || process.env.NODE_ENV === "production";

// Check if pino-pretty is available (it's a devDependency)
const isPinoPrettyAvailable = (): boolean => {
  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
};

const usePrettyPrint = !isProduction && isPinoPrettyAvailable();

// Fields to redact from logs
const redactedFields = [
  "password",
  "pass",
  "apiKey",
  "api_key",
  "secret",
  "token",
  "authorization",
  "cookie",
  "creditCard",
  "ssn",
];

// Create the base logger instance
const baseLogger: Logger = pino({
  name: env.app.name,
  level: isProduction ? "info" : "debug",

  // Redact sensitive fields
  redact: {
    paths: redactedFields.map((field) => `*.${field}`),
    censor: "[REDACTED]",
  },

  // Format options
  formatters: {
    level: (label: string) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      service: env.app.name,
      environment: env.stage,
    }),
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Pretty print in development (only if pino-pretty is available)
  transport: usePrettyPrint
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

/**
 * Application logger with context support.
 */
export const logger = {
  /**
   * Log debug level message
   */
  debug: (message: string, context?: object) => {
    baseLogger.debug(context || {}, message);
  },

  /**
   * Log info level message
   */
  info: (message: string, context?: object) => {
    baseLogger.info(context || {}, message);
  },

  /**
   * Log warning level message
   */
  warn: (message: string, context?: object) => {
    baseLogger.warn(context || {}, message);
  },

  /**
   * Log error level message
   */
  error: (message: string, error?: Error | unknown, context?: object) => {
    if (error instanceof Error) {
      baseLogger.error(
        {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: isProduction ? undefined : error.stack,
          },
        },
        message
      );
    } else {
      baseLogger.error({ ...context, error }, message);
    }
  },

  /**
   * Log fatal level message
   */
  fatal: (message: string, error?: Error | unknown, context?: object) => {
    if (error instanceof Error) {
      baseLogger.fatal(
        {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
        message
      );
    } else {
      baseLogger.fatal({ ...context, error }, message);
    }
  },

  /**
   * Create a child logger with additional context
   */
  child: (bindings: object): Logger => {
    return baseLogger.child(bindings);
  },

  /**
   * Get the underlying Pino instance
   */
  getInstance: (): Logger => baseLogger,
};

/**
 * HTTP request logger middleware compatible with Express
 */
export { baseLogger as pinoLogger };
