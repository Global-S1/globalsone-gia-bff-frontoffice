import { Request, Response, NextFunction } from "express";
import { IRequestContext } from "../../bff/domain/interfaces/request-context.interface";

/**
 * Middleware that creates a request context from the authenticated request.
 * The context is passed to service clients for:
 * - Correlation ID propagation
 * - Auth token forwarding
 * - User context headers
 */
export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const context: IRequestContext = {
    correlationId: req.headers["x-correlation-id"] as string,
    userId: req.user?.sub,
    userEmail: req.user?.email,
    userRoles: req.user?.role ? [req.user.role] : req.user?.roles,
    authorizationHeader: req.headers.authorization,
    timestamp: new Date(),
    clientIp: getClientIp(req),
    userAgent: req.headers["user-agent"],
  };

  // Attach context to request for use in controllers
  req.context = context;

  next();
}

/**
 * Extract client IP from request
 */
function getClientIp(req: Request): string | undefined {
  // Check X-Forwarded-For header (from load balancer/proxy)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0];
    return ips.trim();
  }

  // Check X-Real-IP header (from some proxies)
  const realIp = req.headers["x-real-ip"];
  if (realIp && typeof realIp === "string") {
    return realIp;
  }

  // Fall back to socket remote address
  return req.socket.remoteAddress;
}
