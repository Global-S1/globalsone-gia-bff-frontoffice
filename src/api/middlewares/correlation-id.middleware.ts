import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Middleware that ensures every request has a correlation ID.
 * If the request already has an X-Correlation-ID header, it uses that value.
 * Otherwise, it generates a new UUID.
 *
 * The correlation ID is used for distributed tracing across microservices.
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get existing correlation ID or generate new one
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    uuidv4();

  // Set on request headers for downstream use
  req.headers["x-correlation-id"] = correlationId;

  // Set on response headers for client reference
  res.setHeader("X-Correlation-ID", correlationId);

  next();
}
