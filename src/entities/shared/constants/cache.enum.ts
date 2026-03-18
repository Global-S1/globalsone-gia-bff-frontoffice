export const DEFAULT_CACHE_TTL_SECONDS = 300; // 5 minutes (shorter for BFF aggregated data)

export enum CacheKeys {
  USER_PROFILE = "bff:user_profile",
  DASHBOARD = "bff:dashboard",
  AGGREGATED = "bff:aggregated",
}

export enum CacheTTL {
  USER_PROFILE = 300, // 5 minutes
  DASHBOARD = 180, // 3 minutes
  NOTIFICATIONS_COUNT = 60, // 1 minute
  SERVICE_HEALTH = 30, // 30 seconds
}
