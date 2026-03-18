import { BaseTransformer } from "./base.transformer";
import {
  IOrderData,
  IOrderStats,
  OrderStatus,
} from "../../infrastructure/service-clients/orders-service.client";

/**
 * Transformed order for frontend consumption
 */
export interface ITransformedOrder {
  id: string;
  date: string;
  status: string;
  statusColor: string;
  total: string;
  itemCount: number;
}

/**
 * Transformed order details for frontend
 */
export interface ITransformedOrderDetails extends ITransformedOrder {
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  subtotal: string;
  tax: string;
  shippingAddress: string;
}

/**
 * Transformed order statistics for frontend
 */
export interface ITransformedOrderStats {
  totalOrders: number;
  totalSpent: string;
  averageOrderValue: string;
  loyaltyPoints: string;
}

/**
 * Transformer for order data
 */
export class OrderTransformer extends BaseTransformer<
  IOrderData,
  ITransformedOrder
> {
  transform(input: IOrderData): ITransformedOrder {
    return {
      id: input.id,
      date: this.formatDate(input.createdAt),
      status: this.formatStatus(input.status),
      statusColor: this.getStatusColor(input.status),
      total: this.formatCurrency(input.total),
      itemCount: input.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  /**
   * Transform order with full details
   */
  transformWithDetails(input: IOrderData): ITransformedOrderDetails {
    const basic = this.transform(input);
    return {
      ...basic,
      items: input.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: this.formatCurrency(item.unitPrice),
        total: this.formatCurrency(item.total),
      })),
      subtotal: this.formatCurrency(input.subtotal),
      tax: this.formatCurrency(input.tax),
      shippingAddress: input.shippingAddress,
    };
  }

  private getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      pending: "yellow",
      processing: "blue",
      shipped: "indigo",
      delivered: "green",
      cancelled: "red",
    };
    return colors[status] || "gray";
  }
}

/**
 * Transformer for order statistics
 */
export class OrderStatsTransformer extends BaseTransformer<
  IOrderStats,
  ITransformedOrderStats
> {
  transform(input: IOrderStats): ITransformedOrderStats {
    return {
      totalOrders: input.totalOrders,
      totalSpent: this.formatCurrency(input.totalSpent),
      averageOrderValue: this.formatCurrency(input.averageOrderValue),
      loyaltyPoints: this.formatNumber(input.loyaltyPoints),
    };
  }
}

// Singleton instances
export const orderTransformer = new OrderTransformer();
export const orderStatsTransformer = new OrderStatsTransformer();
