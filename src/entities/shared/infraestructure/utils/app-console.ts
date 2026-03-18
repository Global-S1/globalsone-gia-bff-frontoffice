/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "./logger";

/**
 * @deprecated Use `logger` from './logger.ts' instead for structured logging.
 * This class is kept for backward compatibility.
 */
class AppConsole {
  log(...args: unknown[]) {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");
    logger.info(message);
  }

  info(...args: any[]) {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");
    logger.info(message);
  }

  warn(...args: any[]) {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");
    logger.warn(message);
  }

  error(label: string = "", ...args: any[]) {
    const errors = args.filter((arg) => arg instanceof Error);
    const context = args.filter(
      (arg) => !(arg instanceof Error) && typeof arg === "object"
    );

    if (errors.length > 0) {
      logger.error(label || "ERROR", errors[0], context[0] || {});
    } else {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");
      logger.error(label || message);
    }
  }

  debug(...args: any[]) {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");
    logger.debug(message);
  }
}

export const appConsole = new AppConsole();

// Re-export the modern logger for new code
export { logger };
