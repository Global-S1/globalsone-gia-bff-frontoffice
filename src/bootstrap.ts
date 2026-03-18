import { Redis } from "./entities/shared/infraestructure/services/cache/redis/redis";
import { appConsole } from "./entities/shared/infraestructure/utils/app-console";
import { server } from "./server";
import { loadBackendServicesConfig } from "./bff/infrastructure/config/backend-services.config";
import type { Express } from "express";

// Redis instance for BFF caching
export const redisCache = new Redis();

export async function bootstrap(): Promise<Express> {
  try {
    // Load backend services configuration
    loadBackendServicesConfig();
    appConsole.log("✅ Backend services configuration loaded");

    // Connect to Redis (required for aggregated response caching)
    await redisCache.connect();
    appConsole.log("✅ Redis connected");

    // Return configured Express server
    return server();
  } catch (err) {
    appConsole.error("❌ Error during bootstrap:", err);
    process.exit(1);
  }
}
