import { Router } from "express";
import { userProfileController } from "../controllers/user-profile.controller";

/**
 * Routes for user profile aggregation
 *
 * GET /v1/bff/user-profile/me - Get current user's profile
 * GET /v1/bff/user-profile/:userId - Get a specific user's profile
 */
export function userProfileRoutes(): Router {
  const router = Router();

  // Get current user's profile (must be before :userId to avoid conflict)
  router.get("/me", (req, res, next) =>
    userProfileController.getCurrentUserProfile(req, res, next)
  );

  // Get specific user's profile by ID
  router.get("/:userId", (req, res, next) =>
    userProfileController.getUserProfile(req, res, next)
  );

  return router;
}
