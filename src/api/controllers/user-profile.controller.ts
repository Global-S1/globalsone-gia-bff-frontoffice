import { Request, Response, NextFunction } from "express";
import {
  getUserProfileUseCase,
  IUserProfileData,
} from "../../bff/application/use-cases/get-user-profile.use-case";
import { IAggregatedResponse } from "../../bff/domain/interfaces/aggregated-response.interface";
import { StatusCodes } from "../../entities/shared/infraestructure/lib/http-status-codes";
import { logger } from "../../entities/shared/infraestructure/utils/logger";

/**
 * Controller for user profile aggregation endpoints
 */
export class UserProfileController {
  /**
   * GET /v1/bff/user-profile/:userId
   * Aggregates user profile data from multiple services
   */
  async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.params.userId;
      const context = req.context!;

      // Validate user can only access their own profile (unless admin)
      if (context.userId !== userId && !this.isAdmin(req)) {
        res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only access your own profile",
          },
        });
        return;
      }

      logger.debug("Getting user profile", {
        correlationId: context.correlationId,
        userId,
      });

      const result: IAggregatedResponse<IUserProfileData> =
        await getUserProfileUseCase.execute({ userId }, context);

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
   * GET /v1/bff/user-profile/me
   * Get current user's profile
   */
  async getCurrentUserProfile(
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

      logger.debug("Getting current user profile", {
        correlationId: context.correlationId,
        userId,
      });

      const result = await getUserProfileUseCase.execute({ userId }, context);

      // Set custom headers
      res.setHeader("X-BFF-Duration", String(result.meta.duration));
      if (result.meta.cached) {
        res.setHeader("X-BFF-Cached", "true");
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
   * Check if the request user is an admin
   */
  private isAdmin(req: Request): boolean {
    return req.user?.roles?.includes("admin") || false;
  }
}

// Export singleton instance
export const userProfileController = new UserProfileController();
