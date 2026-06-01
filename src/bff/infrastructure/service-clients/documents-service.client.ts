import { request } from "undici";
import { getServiceConfig, ServiceKeys } from "../config/backend-services.config";

export interface IVoucherUploadResult {
  id: string;
  organizationId: string;
  userId: string | null;
  documentType: string;
  title: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number | null;
  createdAt: string;
}

export class DocumentsServiceClient {
  private readonly baseUrl: string;
  private readonly internalToken: string;

  constructor() {
    const config = getServiceConfig(ServiceKeys.MS_DOCUMENTS);
    this.baseUrl = config.baseUrl;
    this.internalToken = process.env.INTERNAL_SERVICE_TOKEN ?? "";
  }

  async listTemplates(organizationId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v1/templates/${organizationId}?activeOnly=true`, {
      headers: { "x-internal-token": this.internalToken },
    });
    const body = await response.json() as any;
    if (!response.ok) throw Object.assign(new Error(body?.error || "ms-documents error"), { statusCode: response.status });
    return body.data;
  }

  async getTemplateForUser(templateId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v1/templates/user/${templateId}`, {
      headers: { "x-internal-token": this.internalToken },
    });
    const body = await response.json() as any;
    if (!response.ok) throw Object.assign(new Error(body?.error || "ms-documents error"), { statusCode: response.status });
    return body.data;
  }

  async generateDocument(params: {
    templateId: string;
    organizationId: string;
    userId?: string;
    fieldValues: Record<string, string>;
    format: "docx" | "pdf";
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v1/documents/generate`, {
      method: "POST",
      headers: {
        "x-internal-token": this.internalToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    const body = await response.json() as any;
    if (!response.ok) throw Object.assign(new Error(body?.error || "ms-documents error"), { statusCode: response.status });
    return body.data;
  }

  async downloadDocument(documentId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const response = await fetch(`${this.baseUrl}/v1/documents/download/${documentId}`, {
      headers: { "x-internal-token": this.internalToken },
    });
    if (!response.ok) {
      const text = await response.text();
      throw Object.assign(new Error(text || "ms-documents error"), { statusCode: response.status });
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition") || "";
    const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
    const fileName = fileNameMatch ? decodeURIComponent(fileNameMatch[1]) : "documento";
    return { buffer, fileName, mimeType: contentType };
  }

  async uploadVoucher(params: {
    fileBuffer: Buffer;
    originalName: string;
    mimeType: string;
    organizationId: string;
    userId?: string;
    title: string;
  }): Promise<{ success: true; data: IVoucherUploadResult } | { success: false; error: string; statusCode: number }> {
    const formData = new FormData();
    formData.set("file", new File([params.fileBuffer], params.originalName, { type: params.mimeType }));
    formData.set("organizationId", params.organizationId);
    formData.set("title", params.title);
    if (params.userId) formData.set("userId", params.userId);

    try {
      const response = await request(`${this.baseUrl}/v1/documents/voucher`, {
        method: "POST",
        body: formData,
        headers: {
          "x-internal-token": this.internalToken,
        },
        headersTimeout: 15000,
        bodyTimeout: 15000,
      });

      const body = await response.body.text();
      const parsed = JSON.parse(body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return { success: true, data: parsed.data };
      }

      return {
        success: false,
        error: parsed.message ?? "Error al subir voucher a ms-documents",
        statusCode: response.statusCode,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message ?? "Error de conexión con ms-documents",
        statusCode: 503,
      };
    }
  }
}

export function getDocumentsServiceClient(): DocumentsServiceClient {
  return new DocumentsServiceClient();
}
