import { Request, Response } from "express";
import { getAuthServiceClient } from "../../bff/infrastructure/service-clients/auth-service.client";
import { getDocumentsServiceClient } from "../../bff/infrastructure/service-clients/documents-service.client";
import { StatusCodes } from "../../entities/shared/infraestructure/lib/http-status-codes";
import { env } from "../../entities/shared/infraestructure/config/environments";
import { logger } from "../../entities/shared/infraestructure/utils/app-console";

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
    await client.forgotPassword(email, context(req));

    // Always 200 for security (don't reveal if email exists)
    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: "Si el email existe, recibirás un enlace de recuperación." },
    });
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

  async register(req: Request, res: Response): Promise<void> {
    const { email, password, documentType, documentNumber, fullName, phoneNumber } = req.body;

    if (!email || !password || !documentType || !documentNumber || !fullName || !phoneNumber) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Campos obligatorios: email, password, documentType, documentNumber, fullName, phoneNumber",
      });
      return;
    }

    if (documentType !== "DNI" && documentType !== "CE") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "documentType debe ser DNI o CE",
      });
      return;
    }

    let voucherPath: string | undefined;

    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      const docsClient = getDocumentsServiceClient();
      const uploadResult = await docsClient.uploadVoucher({
        fileBuffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        organizationId: env.tenantId,
        title: `Voucher de pago — ${fullName}`,
      });

      if (!uploadResult.success) {
        logger.warn(`[register] Voucher upload failed: ${uploadResult.error}`);
        // Non-blocking: continue registration without voucher
      } else {
        voucherPath = uploadResult.data.id;
      }
    }

    const authClient = getAuthServiceClient();
    const result = await authClient.selfRegister(
      { email, password, documentType, dni: documentNumber, name: fullName, phone: phoneNumber, tenantId: env.tenantId, voucherPath },
      env.internalServiceToken,
      context(req)
    );

    if (!result.success) {
      res.status(result.statusCode).json({ success: false, error: result.error });
      return;
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        status: "pending",
        message: "Solicitud enviada. El administrador revisará tu solicitud de acceso.",
      },
    });
  }
}

export const authController = new AuthController();
