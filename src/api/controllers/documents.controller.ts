import { Request, Response } from "express";
import { getDocumentsServiceClient } from "../../bff/infrastructure/service-clients/documents-service.client";

export async function listTemplates(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.tenantId;
  if (!organizationId) {
    res.status(403).json({ success: false, error: "Contexto de organización no disponible" });
    return;
  }
  const client = getDocumentsServiceClient();
  const data = await client.listTemplates(organizationId);
  res.json({ success: true, data });
}

export async function getTemplate(req: Request, res: Response): Promise<void> {
  const client = getDocumentsServiceClient();
  const data = await client.getTemplateForUser(req.params.id);
  res.json({ success: true, data });
}

export async function generateDocument(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.tenantId;
  const userId = req.user?.sub;
  if (!organizationId) {
    res.status(403).json({ success: false, error: "Contexto de organización no disponible" });
    return;
  }
  const { templateId, fieldValues, format } = req.body;
  if (!templateId || !fieldValues || !format) {
    res.status(400).json({ success: false, error: "templateId, fieldValues y format son requeridos" });
    return;
  }
  if (format !== "docx" && format !== "pdf") {
    res.status(400).json({ success: false, error: "format debe ser docx o pdf" });
    return;
  }
  const client = getDocumentsServiceClient();
  const data = await client.generateDocument({ templateId, organizationId, userId, fieldValues, format });
  res.status(201).json({ success: true, data });
}

export async function downloadDocument(req: Request, res: Response): Promise<void> {
  const client = getDocumentsServiceClient();
  const { buffer, fileName, mimeType } = await client.downloadDocument(req.params.id);
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.send(buffer);
}
