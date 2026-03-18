import { AppError } from "./app-error";
import { internalServerError } from "./handler-error";

export function errorHandler(error: unknown, description?: string): AppError {
  if (error instanceof AppError) {
    return error;
  } else {
    const err = error as Error;
    return internalServerError(
      description ? `${description}: ${err.message}` : err.message
    );
  }
}
