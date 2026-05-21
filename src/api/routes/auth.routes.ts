import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { uploadVoucher } from "../middlewares/upload.middleware";

export function authRoutes(): Router {
  const router = Router();

  router.post("/login", (req, res) => authController.login(req, res));
  router.post("/switch-tenant", (req, res) => authController.switchTenant(req, res));
  router.post("/forgot-password", (req, res) => authController.forgotPassword(req, res));
  router.post("/reset-password", (req, res) => authController.resetPassword(req, res));
  router.post("/register", uploadVoucher, (req, res) => authController.register(req, res));

  return router;
}
