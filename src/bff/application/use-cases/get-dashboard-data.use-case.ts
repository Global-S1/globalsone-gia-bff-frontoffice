import {
  BaseAggregationUseCase,
  IServiceCall,
} from "./base-aggregation.use-case";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IAggregatedResponse } from "../../domain/interfaces/aggregated-response.interface";
import { getUsersServiceClient } from "../../infrastructure/service-clients/users-service.client";
import { getOrdersServiceClient } from "../../infrastructure/service-clients/orders-service.client";
import { getProductsServiceClient } from "../../infrastructure/service-clients/products-service.client";
import { getNotificationsServiceClient } from "../../infrastructure/service-clients/notifications-service.client";
import {
  userTransformer,
  ITransformedUser,
} from "../../domain/transformers/user.transformer";
import {
  orderTransformer,
  ITransformedOrder,
} from "../../domain/transformers/order.transformer";
import { aggregatedCacheService } from "../../infrastructure/cache/aggregated-cache.service";
import { CacheKeys, CacheTTL } from "../../../entities/shared/constants/cache.enum";

/**
 * Input for get dashboard data use case
 */
export interface IGetDashboardInput {
  userId: string;
}

/**
 * Dashboard statistics
 */
export interface IDashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  processingOrders: number;
}

/**
 * Output for dashboard use case
 */
export interface IDashboardData {
  user: ITransformedUser;
  stats: IDashboardStats;
  recentOrders: ITransformedOrder[];
  pendingOrders: ITransformedOrder[];
  unreadNotifications: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

/**
 * Use case for aggregating dashboard data from multiple services.
 * Designed for admin/merchant dashboards.
 */
export class GetDashboardDataUseCase extends BaseAggregationUseCase<
  IGetDashboardInput,
  IDashboardData
> {
  async execute(
    input: IGetDashboardInput,
    context: IRequestContext
  ): Promise<IAggregatedResponse<IDashboardData>> {
    const { userId } = input;

    // Try to get from cache first
    const cacheKey = `${CacheKeys.DASHBOARD}:${userId}`;
    const cached = await aggregatedCacheService.get<IDashboardData>(cacheKey);

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
    const productsService = getProductsServiceClient();
    const notificationsService = getNotificationsServiceClient();

    // Define all service calls
    const calls: IServiceCall<unknown>[] = [
      {
        key: "user",
        service: "users-service",
        call: () => usersService.getUser(userId, context),
        required: true,
      },
      {
        key: "productStats",
        service: "products-service",
        call: () => productsService.getProductStats(context),
        fallback: {
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          topCategories: [],
        },
      },
      {
        key: "recentOrders",
        service: "orders-service",
        call: () => ordersService.getRecentOrders(userId, 10, context),
        fallback: [],
      },
      {
        key: "pendingOrders",
        service: "orders-service",
        call: () => ordersService.getOrdersByStatus("pending", 5, context),
        fallback: [],
      },
      {
        key: "processingOrders",
        service: "orders-service",
        call: () => ordersService.getOrdersByStatus("processing", 5, context),
        fallback: [],
      },
      {
        key: "notificationCount",
        service: "notifications-service",
        call: () => notificationsService.getUnreadCount(userId, context),
        fallback: { total: 0, unread: 0, byType: {} },
      },
    ];

    // Execute all calls in parallel
    const { results, meta } = await this.executeParallel<Record<string, any>>(
      calls,
      context
    );

    // Check for critical failures
    if (this.hasCriticalFailure(meta.partialFailures, ["user"])) {
      return {
        success: false,
        data: {} as IDashboardData,
        meta,
      };
    }

    // Build dashboard stats from results
    const productStats = results.productStats || {};
    const pendingOrdersData = results.pendingOrders || [];
    const processingOrdersData = results.processingOrders || [];

    // Transform data
    const data: IDashboardData = {
      user: userTransformer.transform(results.user),
      stats: {
        totalProducts: productStats.totalProducts || 0,
        activeProducts: productStats.activeProducts || 0,
        lowStockProducts: productStats.lowStockProducts || 0,
        pendingOrders: pendingOrdersData.length,
        processingOrders: processingOrdersData.length,
      },
      recentOrders: orderTransformer.transformMany(results.recentOrders || []),
      pendingOrders: orderTransformer.transformMany(pendingOrdersData),
      unreadNotifications: results.notificationCount?.unread || 0,
      topCategories: productStats.topCategories || [],
    };

    // Cache the result (shorter TTL for dashboard)
    await aggregatedCacheService.set(cacheKey, data, CacheTTL.DASHBOARD);

    return this.success(data, meta);
  }
}

// Export singleton instance
export const getDashboardDataUseCase = new GetDashboardDataUseCase();
