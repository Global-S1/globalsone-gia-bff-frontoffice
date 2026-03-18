import { Request, Response, NextFunction } from "express";
import {
  getDashboardDataUseCase,
  IDashboardData,
} from "../../bff/application/use-cases/get-dashboard-data.use-case";
import { IAggregatedResponse } from "../../bff/domain/interfaces/aggregated-response.interface";
import { StatusCodes } from "../../entities/shared/infraestructure/lib/http-status-codes";
import { logger } from "../../entities/shared/infraestructure/utils/logger";

/**
 * Controller for dashboard aggregation endpoints
 */
export class DashboardController {
  /**
   * GET /v1/bff/dashboard
   * Aggregates dashboard data from multiple services for the current user
   */
  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const context = req.context!;
      const userId = context.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      logger.debug("Getting dashboard data", {
        correlationId: context.correlationId,
        userId,
      });

      const result: IAggregatedResponse<IDashboardData> =
        await getDashboardDataUseCase.execute({ userId }, context);

      // Set custom headers for monitoring
      res.setHeader("X-BFF-Duration", String(result.meta.duration));
      if (result.meta.cached) {
        res.setHeader("X-BFF-Cached", "true");
      }
      if (result.meta.partialFailures.length > 0) {
        res.setHeader(
          "X-Partial-Failures",
          result.meta.partialFailures.map((f) => f.service).join(",")
        );
      }

      if (result.success) {
        res.status(StatusCodes.OK).json(result);
      } else {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json(result);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/bff/dashboard/stats
   * Get dashboard statistics only (lightweight endpoint)
   */
  async getDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const context = req.context!;
      const userId = context.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      logger.debug("Getting dashboard stats", {
        correlationId: context.correlationId,
        userId,
      });

      // Get full dashboard and extract just stats
      const result = await getDashboardDataUseCase.execute({ userId }, context);

      res.setHeader("X-BFF-Duration", String(result.meta.duration));

      if (result.success) {
        res.status(StatusCodes.OK).json({
          success: true,
          data: {
            stats: result.data.stats,
            unreadNotifications: result.data.unreadNotifications,
          },
          meta: result.meta,
        });
      } else {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json(result);
      }
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const dashboardController = new DashboardController();
