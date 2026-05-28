import { Request, Response, NextFunction } from "express";
import { getAuthServiceClient } from "../../bff/infrastructure/service-clients/auth-service.client";
import { getAgentsServiceClient } from "../../bff/infrastructure/service-clients/agents-service.client";
import { StatusCodes } from "../../entities/shared/infraestructure/lib/http-status-codes";

function context(req: Request) {
  return (req as any).requestContext ?? {
    correlationId: req.headers["x-correlation-id"] as string ?? crypto.randomUUID(),
    authorizationHeader: req.headers.authorization,
    userId: req.headers["x-user-id"] as string,
    tenantId: req.headers["x-tenant-id"] as string,
    uniqueTenantToken: req.headers["x-unique-token"] as string,
  };
}

export class ProfileController {
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, error: "No autenticado" });
        return;
      }

      const client = getAuthServiceClient();
      const result = await client.getUserProfile(userId, context(req));

      if (!result.success) {
        res.status(result.statusCode).json({ success: false, error: result.error });
        return;
      }

      res.status(StatusCodes.OK).json({ success: true, data: result.data });
    } catch (error) {
      next(error);
    }
  }

  async getMyUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.headers["x-user-id"] as string;
      const tenantId = req.headers["x-tenant-id"] as string;
      if (!userId || !tenantId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, error: "No autenticado" });
        return;
      }

      const ctx = context(req);
      const agentsClient = getAgentsServiceClient();
      const authClient = getAuthServiceClient();

      const [usageRes, quotaRes] = await Promise.allSettled([
        agentsClient.getMyUsage(ctx),
        authClient.getMyMembershipQuota(userId, tenantId, ctx),
      ]);

      const usage =
        usageRes.status === "fulfilled" && usageRes.value.success
          ? usageRes.value.data
          : { tokensUsed: 0, interactions: 0, accessUntil: null };

      const quota =
        quotaRes.status === "fulfilled" && quotaRes.value.success
          ? quotaRes.value.data
          : null;

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          tokensUsed: usage?.tokensUsed ?? 0,
          interactions: usage?.interactions ?? 0,
          accessUntil: quota?.accessUntil ?? null,
          tokenLimit: quota?.tokenLimit ?? null,
          membershipStatus: quota?.status ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
