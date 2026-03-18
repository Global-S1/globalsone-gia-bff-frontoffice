import { BaseTransformer } from "./base.transformer";
import {
  IUserData,
  IUserPreferences,
} from "../../infrastructure/service-clients/users-service.client";

/**
 * Transformed user for frontend consumption
 */
export interface ITransformedUser {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  memberSince: string;
}

/**
 * Transformed user preferences for frontend
 */
export interface ITransformedPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

/**
 * Transformer for user data
 */
export class UserTransformer extends BaseTransformer<IUserData, ITransformedUser> {
  private readonly defaultAvatar = "/images/default-avatar.png";

  transform(input: IUserData): ITransformedUser {
    return {
      id: input.id,
      displayName: this.formatDisplayName(input.firstName, input.lastName),
      email: input.email,
      avatar: this.defaultValue(input.avatar, this.defaultAvatar),
      memberSince: this.formatRelativeDate(input.createdAt),
    };
  }

  private formatDisplayName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }
}

/**
 * Transformer for user preferences
 */
export class UserPreferencesTransformer extends BaseTransformer<
  IUserPreferences,
  ITransformedPreferences
> {
  transform(input: IUserPreferences): ITransformedPreferences {
    return {
      theme: input.theme,
      language: input.language,
      notificationsEnabled: input.notificationsEnabled,
      emailNotifications: this.defaultValue(input.emailNotifications, true),
    };
  }
}

// Singleton instances
export const userTransformer = new UserTransformer();
export const userPreferencesTransformer = new UserPreferencesTransformer();
