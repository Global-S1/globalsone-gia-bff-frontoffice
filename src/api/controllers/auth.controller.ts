import { Request, Response } from "express";
import { getAuthServiceClient } from "../../bff/infrastructure/service-clients/auth-service.client";
import { StatusCodes } from "../../entities/shared/infraestructure/lib/http-status-codes";

function context(req: Request) {
  return (req as any).requestContext ?? {
    correlationId: req.headers["x-correlation-id"] as string ?? crypto.randomUUID(),
    authorizationHeader: req.headers.authorization,
  };
}

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const client = getAuthServiceClient();
    const result = await client.login(req.body, context(req));

    if (!result.success) {
      res.status(result.statusCode).json({ success: false, error: result.error });
      return;
    }

    res.status(StatusCodes.OK).json({ success: true, data: result.data });
  }

  async switchTenant(req: Request, res: Response): Promise<void> {
    const client = getAuthServiceClient();
    const result = await client.switchTenant(req.body, context(req));

    if (!result.success) {
      res.status(result.statusCode).json({ success: false, error: result.error });
      return;
    }

    res.status(StatusCodes.OK).json({ success: true, data: result.data });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const client = getAuthServiceClient();
    const { email } = req.body;
    const result = await client.forgotPassword(email, context(req));

    // Always 200 for security (don't reveal if email exists)
    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: "Si el email existe, recibirás un enlace de recuperación." },
    });

    if (!result.success) {
      // Log internally but don't expose
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const client = getAuthServiceClient();
    const { token, newPassword } = req.body;
    const result = await client.resetPassword(token, newPassword, context(req));

    if (!result.success) {
      res.status(result.statusCode).json({ success: false, error: result.error });
      return;
    }

    res.status(StatusCodes.OK).json({ success: true, data: { message: "Contraseña actualizada correctamente." } });
  }

  // Stub: ms-auth doesn't have self-registration yet.
  // When ms-auth adds POST /v1/auth/register, proxy here.
  async register(_req: Request, res: Response): Promise<void> {
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        status: "pending",
        message: "Solicitud recibida. El administrador revisará tu solicitud de acceso.",
      },
    });
  }
}

export const authController = new AuthController();
