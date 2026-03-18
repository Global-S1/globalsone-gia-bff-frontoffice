import { BaseServiceClient } from "./base-service-client";
import {
  getServiceConfig,
  ServiceKeys,
} from "../config/backend-services.config";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";

/**
 * User data from the users service
 */
export interface IUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User preferences from the users service
 */
export interface IUserPreferences {
  userId: string;
  theme: "light" | "dark" | "system";
  language: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

/**
 * Client for the Users microservice
 */
export class UsersServiceClient extends BaseServiceClient {
  constructor() {
    super(getServiceConfig(ServiceKeys.USERS));
  }

  /**
   * Get user by ID
   */
  async getUser(
    userId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IUserData>> {
    return this.request<IUserData>(
      {
        method: "GET",
        path: `/v1/users/${userId}`,
      },
      context
    );
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(
    userId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IUserPreferences>> {
    return this.request<IUserPreferences>(
      {
        method: "GET",
        path: `/v1/users/${userId}/preferences`,
      },
      context
    );
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<IUserPreferences>,
    context: IRequestContext
  ): Promise<IServiceResponse<IUserPreferences>> {
    return this.request<IUserPreferences>(
      {
        method: "PATCH",
        path: `/v1/users/${userId}/preferences`,
        body: preferences,
      },
      context
    );
  }

  /**
   * Search users (for admin dashboard)
   */
  async searchUsers(
    query: string,
    page: number,
    limit: number,
    context: IRequestContext
  ): Promise<IServiceResponse<{ users: IUserData[]; total: number }>> {
    return this.request<{ users: IUserData[]; total: number }>(
      {
        method: "GET",
        path: "/v1/users",
        query: { q: query, page, limit },
      },
      context
    );
  }
}

// Singleton instance
let instance: UsersServiceClient | null = null;

export function getUsersServiceClient(): UsersServiceClient {
  if (!instance) {
    instance = new UsersServiceClient();
  }
  return instance;
}
