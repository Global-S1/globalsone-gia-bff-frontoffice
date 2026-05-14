import { BaseServiceClient } from "./base-service-client";
import { getServiceConfig, ServiceKeys } from "../config/backend-services.config";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ISwitchTenantPayload {
  userId: string;
  tenantId: string;
}

export interface IAuthUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  mustChangePassword: boolean;
}

export interface ITenantSummary {
  id: string;
  name: string;
  role: string;
}

export interface ILoginTokenResult {
  accessToken: string;
  refreshToken: string;
  user: IAuthUser;
}

export interface ILoginSelectionResult {
  requiresSelection: true;
  userId: string;
  email: string;
  tenants: ITenantSummary[];
}

export type ILoginResult = ILoginTokenResult | ILoginSelectionResult;

export class AuthServiceClient extends BaseServiceClient {
  constructor() {
    super(getServiceConfig(ServiceKeys.MS_AUTH));
  }

  async login(
    payload: ILoginPayload,
    context: IRequestContext
  ): Promise<IServiceResponse<ILoginResult>> {
    return this.request<ILoginResult>(
      { method: "POST", path: "/v1/auth/login", body: payload },
      context
    );
  }

  async switchTenant(
    payload: ISwitchTenantPayload,
    context: IRequestContext
  ): Promise<IServiceResponse<ILoginTokenResult>> {
    return this.request<ILoginTokenResult>(
      { method: "POST", path: "/v1/auth/switch-tenant", body: payload },
      context
    );
  }

  async forgotPassword(
    email: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      { method: "POST", path: "/v1/auth/forgot-password", body: { email } },
      context
    );
  }

  async resetPassword(
    token: string,
    newPassword: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      {
        method: "POST",
        path: "/v1/auth/reset-password",
        body: { token, newPassword },
      },
      context
    );
  }
}

let instance: AuthServiceClient | null = null;

export function getAuthServiceClient(): AuthServiceClient {
  if (!instance) {
    instance = new AuthServiceClient();
  }
  return instance;
}
