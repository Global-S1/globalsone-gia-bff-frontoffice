import {
  BaseAggregationUseCase,
  IServiceCall,
} from "./base-aggregation.use-case";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IAggregatedResponse } from "../../domain/interfaces/aggregated-response.interface";
import { getUsersServiceClient } from "../../infrastructure/service-clients/users-service.client";
import { getOrdersServiceClient } from "../../infrastructure/service-clients/orders-service.client";
import { getNotificationsServiceClient } from "../../infrastructure/service-clients/notifications-service.client";
import {
  userTransformer,
  userPreferencesTransformer,
  ITransformedUser,
  ITransformedPreferences,
} from "../../domain/transformers/user.transformer";
import {
  orderTransformer,
  orderStatsTransformer,
  ITransformedOrder,
  ITransformedOrderStats,
} from "../../domain/transformers/order.transformer";
import { aggregatedCacheService } from "../../infrastructure/cache/aggregated-cache.service";
import { CacheKeys, CacheTTL } from "../../../entities/shared/constants/cache.enum";

/**
 * Input for get user profile use case
 */
export interface IGetUserProfileInput {
  userId: string;
}

/**
 * Output for get user profile use case
 */
export interface IUserProfileData {
  user: ITransformedUser;
  preferences: ITransformedPreferences;
  recentOrders: ITransformedOrder[];
  unreadNotifications: number;
  stats: ITransformedOrderStats;
}

/**
 * Use case for aggregating user profile data from multiple services.
 * Calls:
 * - users-service → user data
 * - users-service → preferences
 * - orders-service → recent orders
 * - orders-service → statistics
 * - notifications-service → unread count
 */
export class GetUserProfileUseCase extends BaseAggregationUseCase<
  IGetUserProfileInput,
  IUserProfileData
> {
  async execute(
    input: IGetUserProfileInput,
    context: IRequestContext
  ): Promise<IAggregatedResponse<IUserProfileData>> {
    const { userId } = input;

    // Try to get from cache first
    const cacheKey = `${CacheKeys.USER_PROFILE}:${userId}`;
    const cached = await aggregatedCacheService.get<IUserProfileData>(cacheKey);

    if (cached) {
      return {
        success: true,
        data: cached,
        meta: {
          duration: 0,
          partialFailures: [],
          cached: true,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Get service clients
    const usersService = getUsersServiceClient();
    const ordersService = getOrdersServiceClient();
    const notificationsService = getNotificationsServiceClient();

    // Define all service calls
    const calls: IServiceCall<unknown>[] = [
      {
        key: "user",
        service: "users-service",
        call: () => usersService.getUser(userId, context),
        required: true, // User data is critical
      },
      {
        key: "preferences",
        service: "users-service",
        call: () => usersService.getUserPreferences(userId, context),
        fallback: {
          userId,
          theme: "system" as const,
          language: "en",
          notificationsEnabled: true,
          emailNotifications: true,
        },
      },
      {
        key: "recentOrders",
        service: "orders-service",
        call: () => ordersService.getRecentOrders(userId, 5, context),
        fallback: [],
      },
      {
        key: "stats",
        service: "orders-service",
        call: () => ordersService.getUserOrderStats(userId, context),
        fallback: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          loyaltyPoints: 0,
        },
      },
      {
        key: "notificationCount",
        service: "notifications-service",
        call: () => notificationsService.getUnreadCount(userId, context),
        fallback: { total: 0, unread: 0, byType: {} },
      },
    ];

    // Execute all calls in parallel
    const { results, meta } = await this.executeParallel<{
      user: ReturnType<typeof usersService.getUser> extends Promise<infer R>
        ? R extends { data?: infer D }
          ? D
          : never
        : never;
      preferences: ReturnType<
        typeof usersService.getUserPreferences
      > extends Promise<infer R>
        ? R extends { data?: infer D }
          ? D
          : never
        : never;
      recentOrders: ReturnType<
        typeof ordersService.getRecentOrders
      > extends Promise<infer R>
        ? R extends { data?: infer D }
          ? D
          : never
        : never;
      stats: ReturnType<
        typeof ordersService.getUserOrderStats
      > extends Promise<infer R>
        ? R extends { data?: infer D }
          ? D
          : never
        : never;
      notificationCount: ReturnType<
        typeof notificationsService.getUnreadCount
      > extends Promise<infer R>
        ? R extends { data?: infer D }
          ? D
          : never
        : never;
    }>(calls, context);

    // Check for critical failures
    if (this.hasCriticalFailure(meta.partialFailures, ["user"])) {
      return {
        success: false,
        data: {} as IUserProfileData,
        meta,
      };
    }

    // Transform data
    const data: IUserProfileData = {
      user: userTransformer.transform(results.user as any),
      preferences: userPreferencesTransformer.transform(
        results.preferences as any
      ),
      recentOrders: orderTransformer.transformMany(
        (results.recentOrders as any[]) || []
      ),
      unreadNotifications: (results.notificationCount as any)?.unread || 0,
      stats: orderStatsTransformer.transform(results.stats as any),
    };

    // Cache the result
    await aggregatedCacheService.set(cacheKey, data, CacheTTL.USER_PROFILE);

    return this.success(data, meta);
  }
}

// Export singleton instance
export const getUserProfileUseCase = new GetUserProfileUseCase();
