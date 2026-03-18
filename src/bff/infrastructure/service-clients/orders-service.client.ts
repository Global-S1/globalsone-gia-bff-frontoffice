import { BaseServiceClient } from "./base-service-client";
import {
  getServiceConfig,
  ServiceKeys,
} from "../config/backend-services.config";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";

/**
 * Order status enum
 */
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Order item from the orders service
 */
export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Order data from the orders service
 */
export interface IOrderData {
  id: string;
  userId: string;
  items: IOrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User order statistics
 */
export interface IOrderStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints: number;
}

/**
 * Client for the Orders microservice
 */
export class OrdersServiceClient extends BaseServiceClient {
  constructor() {
    super(getServiceConfig(ServiceKeys.ORDERS));
  }

  /**
   * Get orders for a user
   */
  async getUserOrders(
    userId: string,
    limit: number,
    offset: number,
    context: IRequestContext
  ): Promise<IServiceResponse<{ orders: IOrderData[]; total: number }>> {
    return this.request<{ orders: IOrderData[]; total: number }>(
      {
        method: "GET",
        path: `/v1/users/${userId}/orders`,
        query: { limit, offset },
      },
      context
    );
  }

  /**
   * Get recent orders for a user
   */
  async getRecentOrders(
    userId: string,
    limit: number,
    context: IRequestContext
  ): Promise<IServiceResponse<IOrderData[]>> {
    return this.request<IOrderData[]>(
      {
        method: "GET",
        path: `/v1/users/${userId}/orders/recent`,
        query: { limit },
      },
      context
    );
  }

  /**
   * Get order by ID
   */
  async getOrder(
    orderId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IOrderData>> {
    return this.request<IOrderData>(
      {
        method: "GET",
        path: `/v1/orders/${orderId}`,
      },
      context
    );
  }

  /**
   * Get order statistics for a user
   */
  async getUserOrderStats(
    userId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IOrderStats>> {
    return this.request<IOrderStats>(
      {
        method: "GET",
        path: `/v1/users/${userId}/orders/stats`,
      },
      context
    );
  }

  /**
   * Get orders by status (for dashboard)
   */
  async getOrdersByStatus(
    status: OrderStatus,
    limit: number,
    context: IRequestContext
  ): Promise<IServiceResponse<IOrderData[]>> {
    return this.request<IOrderData[]>(
      {
        method: "GET",
        path: "/v1/orders",
        query: { status, limit },
      },
      context
    );
  }
}

// Singleton instance
let instance: OrdersServiceClient | null = null;

export function getOrdersServiceClient(): OrdersServiceClient {
  if (!instance) {
    instance = new OrdersServiceClient();
  }
  return instance;
}
