import { Request, Response } from "express";
import { request } from "undici";
import { PorterStemmerEs } from "natural";
import { env } from "../../entities/shared/infraestructure/config/environments";
import { getAgentsServiceClient } from "../../bff/infrastructure/service-clients/agents-service.client";
import { getDocumentsServiceClient } from "../../bff/infrastructure/service-clients/documents-service.client";

const STOP_WORDS = new Set(['de','el','la','los','las','un','una','para','con','que','por','del','al','en','y','o','a','se','su','sus','es','lo','le','me','te','nos','esto','esta','este','como','más','si','ya','hay','fue','ser','son','han','has','era','este','esa','ese']);

function stemTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .map(w => PorterStemmerEs.stem(w));
}

interface TemplateItem { id: string; title: string; intention: string; }

function scoreTemplate(questionStems: string[], template: TemplateItem): number {
  const intentionStems = stemTokens(`${template.title} ${template.intention}`);
  const intentionSet = new Set(intentionStems);
  return questionStems.filter(s => intentionSet.has(s)).length;
}

function rankTemplates(question: string, templates: TemplateItem[], topN = 5): TemplateItem[] {
  const qStems = stemTokens(question);
  if (qStems.length === 0) return templates.slice(0, topN);

  return templates
    .map(t => ({ t, score: scoreTemplate(qStems, t) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ t }) => t);
}

function buildSystemContext(templates: TemplateItem[]): string {
  const list = templates.map(t =>
    `- ${t.title}: ${t.intention}\n  Marcador listo para usar: [[TEMPLATE:${t.id}:${t.title}]]`
  ).join("\n");
  return [
    "## Plantillas de documentos disponibles",
    "Sugiere una plantilla SOLO cuando el usuario necesita claramente generar un documento formal (por ejemplo, pide redactar, firmar o descargar un documento concreto). NO la sugieras en consultas informativas o conversaciones generales.",
    "Si decides sugerir una plantilla, copia el marcador correspondiente AL FINAL de tu respuesta, exactamente como aparece en la lista (no lo modifiques).",
    "Plantillas relevantes para esta consulta:",
    list,
  ].join("\n");
}

async function resolveDefaultAgentId(uniqueTenantToken: string, userId: string, correlationId: string): Promise<string | null> {
  try {
    const { statusCode, body } = await request(
      `${env.backendServices.agents.url}/v1/agent/find-agents?defaultOnly=true`,
      {
        method: "GET",
        headers: {
          "x-unique-token": uniqueTenantToken,
          "x-user-id": userId,
          "X-Correlation-ID": correlationId,
        },
        headersTimeout: 5000,
        bodyTimeout: 5000,
      }
    );
    if (statusCode !== 200) { await body.dump(); return null; }
    const parsed = JSON.parse(await body.text());
    const items = parsed?.data?.items;
    if (Array.isArray(items) && items.length > 0) return items[0].id as string;
    return null;
  } catch {
    return null;
  }
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  const { question, conversationId } = req.body as { question: string; conversationId?: string };
  const uniqueTenantToken = req.user?.uniqueTenantToken;
  const userId = req.user?.sub;

  if (!question?.trim()) {
    res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "La pregunta no puede estar vacía" } });
    return;
  }

  if (!uniqueTenantToken || !userId) {
    res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Contexto de usuario u organización no disponible" } });
    return;
  }

  const correlationId = (req.headers["x-correlation-id"] as string) ?? "";

  const payload: Record<string, unknown> = {
    message: question,
    uniqueOrganizationToken: uniqueTenantToken,
  };
  if (conversationId) {
    payload.chatPerUserId = conversationId;
  } else {
    const agentId = await resolveDefaultAgentId(uniqueTenantToken, userId, correlationId);
    if (agentId) payload.agentId = agentId;
  }

  // Build stemming-filtered template context for AI
  const tenantId = req.user?.tenantId;
  if (tenantId) {
    try {
      const docsClient = getDocumentsServiceClient();
      const templates = await docsClient.listTemplates(tenantId);
      const allTemplates: TemplateItem[] = Array.isArray(templates?.items)
        ? templates.items
        : Array.isArray(templates) ? templates : [];

      if (allTemplates.length > 0) {
        const matched = rankTemplates(question, allTemplates);
        // If stemming found no match, send top-5 by default so AI can still judge relevance
        const candidates = matched.length > 0 ? matched : allTemplates.slice(0, 5);
        payload.systemContext = buildSystemContext(candidates);
      }
    } catch {
      // Non-blocking: continue without template context if fetch fails
    }
  }

  try {
    const { statusCode, headers, body } = await request(
      `${env.backendServices.agents.url}/v1/chat/create-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-unique-token": uniqueTenantToken,
          "x-user-id": userId,
          "X-Correlation-ID": correlationId,
        },
        body: JSON.stringify(payload),
        headersTimeout: 15000,
        bodyTimeout: 120000,
      }
    );

    if (statusCode !== 200) {
      const text = await body.text().catch(() => "");
      res.status(statusCode).json({
        success: false,
        error: { code: "AGENTS_ERROR", message: text || "Error del servicio de agentes" },
      });
      return;
    }

    const chatSessionId = headers["chat-session-id"] as string | undefined;
    const threadId = headers["thread-id"] as string | undefined;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Expose-Headers", "Chat-Session-Id, Thread-Id");
    if (chatSessionId) res.setHeader("Chat-Session-Id", chatSessionId);
    if (threadId) res.setHeader("Thread-Id", threadId);
    res.status(200);
    res.flushHeaders();

    for await (const chunk of body) {
      const text = (chunk as Buffer).toString("utf-8");
      if (text) {
        res.write(`data: ${JSON.stringify(text)}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch {
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: { code: "AGENTS_UNAVAILABLE", message: "Servicio de agentes no disponible" },
      });
    }
  }
}

export async function listConversations(req: Request, res: Response): Promise<void> {
  const uniqueTenantToken = req.user?.uniqueTenantToken;
  const userId = req.user?.sub;

  if (!uniqueTenantToken || !userId) {
    res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Contexto de usuario incompleto" } });
    return;
  }

  const client = getAgentsServiceClient();
  const result = await client.getConversations(uniqueTenantToken, userId, req.context!);

  if (!result.success) {
    res.status(result.statusCode).json({ success: false, error: result.error });
    return;
  }

  const items = (result.data as any)?.items ?? result.data ?? [];
  res.json({ success: true, data: items });
}

export async function getConversation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const client = getAgentsServiceClient();
  const result = await client.getConversation(id, req.context!);

  if (!result.success) {
    res.status(result.statusCode).json({ success: false, error: result.error });
    return;
  }

  const conversation = (result.data as any)?.item ?? result.data;
  res.json({ success: true, data: conversation });
}

export async function removeConversation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const client = getAgentsServiceClient();
  const result = await client.deleteConversation(id, req.context!);

  if (!result.success) {
    res.status(result.statusCode).json({ success: false, error: result.error });
    return;
  }

  res.status(204).send();
}
