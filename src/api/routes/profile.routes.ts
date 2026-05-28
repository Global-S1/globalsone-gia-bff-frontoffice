import { Router } from "express";
import { profileController } from "../controllers/profile.controller";

export function profileRoutes(): Router {
  const router = Router();

  router.get("/me", (req, res, next) => profileController.getMyProfile(req, res, next));
  router.get("/usage", (req, res, next) => profileController.getMyUsage(req, res, next));

  return router;
}
