import { Router } from "express";
import { listTemplates, getTemplate, generateDocument, downloadDocument } from "../controllers/documents.controller";

const wrap = (fn: Function) => async (req: any, res: any, next: any) => {
  try { await fn(req, res); } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ success: false, error: err.message || "Error interno" });
  }
};

export function documentsRoutes(): Router {
  const router = Router();

  router.get("/templates", wrap(listTemplates));
  router.get("/templates/:id", wrap(getTemplate));
  router.post("/generate", wrap(generateDocument));
  router.get("/download/:id", wrap(downloadDocument));

  return router;
}
