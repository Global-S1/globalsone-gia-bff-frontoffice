import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";

/**
 * Routes for dashboard aggregation
 *
 * GET /v1/bff/dashboard - Get full dashboard data
 * GET /v1/bff/dashboard/stats - Get dashboard statistics only
 */
export function dashboardRoutes(): Router {
  const router = Router();

  // Get dashboard statistics (lightweight)
  router.get("/stats", (req, res, next) =>
    dashboardController.getDashboardStats(req, res, next)
  );

  // Get full dashboard data
  router.get("/", (req, res, next) =>
    dashboardController.getDashboard(req, res, next)
  );

  return router;
}
