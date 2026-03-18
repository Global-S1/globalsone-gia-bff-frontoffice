/**
 * Cache key patterns for BFF aggregated responses.
 * Use these patterns to build cache keys with entity IDs.
 */
export const BffCachePatterns = {
  /** User profile aggregation: bff:user_profile:{userId} */
  USER_PROFILE: "bff:user_profile",

  /** Dashboard aggregation: bff:dashboard:{userId} */
  DASHBOARD: "bff:dashboard",

  /** Generic aggregation: bff:aggregated:{key} */
  AGGREGATED: "bff:aggregated",

  /** Service health cache: bff:health:{service} */
  SERVICE_HEALTH: "bff:health",
} as const;

/**
 * Cache TTLs in seconds for different types of data
 */
export const BffCacheTTL = {
  /** User profile data - 5 minutes */
  USER_PROFILE: 300,

  /** Dashboard data - 3 minutes */
  DASHBOARD: 180,

  /** Notifications count - 1 minute */
  NOTIFICATIONS_COUNT: 60,

  /** Service health - 30 seconds */
  SERVICE_HEALTH: 30,

  /** Default TTL - 5 minutes */
  DEFAULT: 300,
} as const;

/**
 * Build a cache key with entity ID
 */
export function buildCacheKey(pattern: string, ...ids: string[]): string {
  return `${pattern}:${ids.join(":")}`;
}

/**
 * Build a pattern for cache invalidation (wildcard)
 */
export function buildInvalidationPattern(pattern: string, id?: string): string {
  if (id) {
    return `${pattern}:${id}*`;
  }
  return `${pattern}:*`;
}
