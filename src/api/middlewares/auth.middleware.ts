import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../entities/shared/infraestructure/config/environments";
import { StatusCodes } from "../../entities/shared/infraestructure/lib/http-status-codes";

// Paths that don't require authentication
const PUBLIC_PATHS = [
  "/v1/health",
  "/v1/health/live",
  "/v1/health/ready",
  "/v1/health/detailed",
];

interface JwtPayload {
  sub: string;
  email?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Authentication Middleware for BFF.
 * Validates JWT tokens and extracts user information.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = req.headers["x-correlation-id"] as string;
  const path = req.path;

  // Skip auth for public paths
  if (isPublicPath(path)) {
    return next();
  }

  // Check for Bearer token
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
      correlationId,
    });
    return;
  }

  // Validate JWT
  try {
    const payload = jwt.verify(token, env.bff.jwtSecret) as JwtPayload;

    // Attach user info to request
    req.user = {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };

    // Forward user info in headers to upstream services
    if (payload.sub) {
      req.headers["x-user-id"] = payload.sub;
    }
    if (payload.roles) {
      req.headers["x-user-roles"] = payload.roles.join(",");
    }

    next();
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError
        ? "Token has expired"
        : error instanceof jwt.JsonWebTokenError
          ? "Invalid token"
          : "Authentication failed";

    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message,
      },
      correlationId,
    });
  }
}

/**
 * Extract bearer token from authorization header
 */
function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Check if path is public (no auth required)
 */
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(
    (publicPath) =>
      path === publicPath || path.startsWith(`${publicPath}/`)
  );
}
