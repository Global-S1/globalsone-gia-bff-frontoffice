import { BaseServiceClient } from "./base-service-client";
import {
  getServiceConfig,
  ServiceKeys,
} from "../config/backend-services.config";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";

/**
 * Notification type enum
 */
export type NotificationType =
  | "order"
  | "promotion"
  | "system"
  | "message"
  | "alert";

/**
 * Notification data from the notifications service
 */
export interface INotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

/**
 * Notification count by type
 */
export interface INotificationCount {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

/**
 * Client for the Notifications microservice
 */
export class NotificationsServiceClient extends BaseServiceClient {
  constructor() {
    super(getServiceConfig(ServiceKeys.NOTIFICATIONS));
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number,
    offset: number,
    context: IRequestContext
  ): Promise<
    IServiceResponse<{ notifications: INotificationData[]; total: number }>
  > {
    return this.request<{
      notifications: INotificationData[];
      total: number;
    }>(
      {
        method: "GET",
        path: `/v1/users/${userId}/notifications`,
        query: { limit, offset },
      },
      context
    );
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(
    userId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<INotificationCount>> {
    return this.request<INotificationCount>(
      {
        method: "GET",
        path: `/v1/users/${userId}/notifications/count`,
      },
      context
    );
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(
    userId: string,
    limit: number,
    context: IRequestContext
  ): Promise<IServiceResponse<INotificationData[]>> {
    return this.request<INotificationData[]>(
      {
        method: "GET",
        path: `/v1/users/${userId}/notifications/recent`,
        query: { limit },
      },
      context
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(
      {
        method: "PATCH",
        path: `/v1/notifications/${notificationId}/read`,
      },
      context
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(
    userId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{ count: number }>> {
    return this.request<{ count: number }>(
      {
        method: "POST",
        path: `/v1/users/${userId}/notifications/mark-all-read`,
      },
      context
    );
  }
}

// Singleton instance
let instance: NotificationsServiceClient | null = null;

export function getNotificationsServiceClient(): NotificationsServiceClient {
  if (!instance) {
    instance = new NotificationsServiceClient();
  }
  return instance;
}
