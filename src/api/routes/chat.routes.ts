import { Router } from "express";
import { createConversation, listConversations, getConversation, removeConversation } from "../controllers/chat.controller";

export function chatRoutes(): Router {
  const router = Router();

  router.post("/chat", createConversation);
  router.get("/conversations", listConversations);
  router.get("/conversations/:id", getConversation);
  router.delete("/conversations/:id", removeConversation);

  return router;
}
