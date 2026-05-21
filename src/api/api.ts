import { Router, Request, Response } from "express";
import { StatusCodes } from "../entities/shared/infraestructure/lib/http-status-codes";
import { env } from "../entities/shared/infraestructure/config/environments";
import { authMiddleware } from "./middlewares/auth.middleware";
import { requestContextMiddleware } from "./middlewares/request-context.middleware";
import { getServicesHealth } from "../bff/infrastructure/config/backend-services.config";
import { authRoutes } from "./routes/auth.routes";
import { chatRoutes } from "./routes/chat.routes";
import { profileRoutes } from "./routes/profile.routes";
import { ApiResponse } from "../entities/shared/infraestructure/utils/api-response";

export function api(): Router {
  const router = Router();

  // Health check endpoint - basic (no auth required)
  router.get("/health", (_req: Request, res: Response) => {
    const startTime = process.hrtime();
    const healthInfo = {
      status: "healthy",
      service: env.app.name,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB",
      },
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(healthInfo, "Servicio online", StatusCodes.OK, startTime)
    );
  });

  // Liveness probe (simple check for Kubernetes)
  router.get("/health/live", (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ status: "alive" });
  });

  // Readiness probe (checks backend services)
  router.get("/health/ready", async (_req: Request, res: Response) => {
    try {
      const servicesHealth = await getServicesHealth();
      const allHealthy = Object.values(servicesHealth).every(
        (service) => service.healthy
      );

      if (allHealthy) {
        res.status(StatusCodes.OK).json({
          status: "ready",
          services: servicesHealth,
        });
      } else {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
          status: "degraded",
          services: servicesHealth,
        });
      }
    } catch (error) {
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: "not_ready",
        error: "Health check failed",
      });
    }
  });

  // Detailed health endpoint (includes all backend services status)
  router.get("/health/detailed", async (_req: Request, res: Response) => {
    try {
      const servicesHealth = await getServicesHealth();
      const healthyCount = Object.values(servicesHealth).filter(
        (s) => s.healthy
      ).length;
      const totalCount = Object.keys(servicesHealth).length;

      const status =
        healthyCount === totalCount
          ? "healthy"
          : healthyCount > 0
            ? "degraded"
            : "unhealthy";

      res.status(StatusCodes.OK).json({
        status,
        service: env.app.name,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        backendServices: {
          healthy: healthyCount,
          total: totalCount,
          services: servicesHealth,
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: "MB",
        },
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        error: "Failed to aggregate health status",
      });
    }
  });

  // Public auth routes (no JWT required)
  router.use("/auth", authRoutes());

  // Protected BFF routes
  const bffRouter = Router();

  // Apply auth middleware
  bffRouter.use(authMiddleware);

  // Apply request context middleware (extracts user info, correlation ID, etc.)
  bffRouter.use(requestContextMiddleware);

  // BFF routes
  bffRouter.use("/bff", chatRoutes());
  bffRouter.use("/bff/profile", profileRoutes());

  // Mount BFF routes
  router.use("/", bffRouter);

  return router;
}
