import { Request, Response, NextFunction } from "express";
import { request } from "undici";
import { env } from "../../entities/shared/infraestructure/config/environments";
import { StatusCodes } from "../../entities/shared/infraestructure/lib/http-status-codes";

const PUBLIC_PREFIXES = [
  "/v1/health",
  "/v1/auth",
];

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (isPublicPath(req.path)) {
    return next();
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  try {
    const { statusCode, headers } = await request(
      `${env.backendServices.auth.url}/v1/auth/validate`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Original-URI": req.path,
          "X-Correlation-ID": req.headers["x-correlation-id"] as string ?? "",
        },
        headersTimeout: 5000,
        bodyTimeout: 5000,
      }
    );

    if (statusCode !== 200) {
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 403 ? "FORBIDDEN" : "INVALID_TOKEN",
          message: statusCode === 403 ? "Acceso denegado" : "Sesión inválida o expirada",
        },
      });
      return;
    }

    // Attach identity from ms-auth response headers
    req.user = {
      sub: headers["x-user-id"] as string,
      tenantId: headers["x-tenant-id"] as string,
      role: headers["x-user-role"] as string,
      permissions: headers["x-user-permissions"] as string,
      uniqueTenantToken: headers["x-unique-token"] as string,
    };

    // Forward identity to upstream services
    req.headers["x-user-id"] = req.user.sub;
    req.headers["x-tenant-id"] = req.user.tenantId ?? "";

    next();
  } catch {
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      success: false,
      error: { code: "AUTH_SERVICE_UNAVAILABLE", message: "El servicio de autenticación no está disponible" },
    });
  }
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  return parts.length === 2 && parts[0].toLowerCase() === "bearer" ? parts[1] : null;
}

function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
