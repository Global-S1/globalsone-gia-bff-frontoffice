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

export interface ISelfRegisterPayload {
  email: string;
  password: string;
  dni: string;
  name: string;
  phone: string;
  tenantId: string;
  voucherPath?: string;
}

export interface ISelfRegisterResult {
  userId: string;
  status: "pending";
}

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

  async selfRegister(
    payload: ISelfRegisterPayload,
    internalServiceToken: string,
    context: IRequestContext
  ): Promise<IServiceResponse<ISelfRegisterResult>> {
    return this.request<ISelfRegisterResult>(
      {
        method: "POST",
        path: "/v1/rbac/users/self-register",
        body: payload,
        headers: { "X-Internal-Service-Token": internalServiceToken },
      },
      context
    );
  }

  async getUserProfile(
    userId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<any>> {
    return this.request<any>(
      { method: "GET", path: `/v1/rbac/users/${userId}` },
      context
    );
  }

  /**
   * Internal lookup of the {status, accessUntil, tokenLimit} tuple for the
   * caller's membership in their active tenant. Gated by the internal
   * service token at ms-auth.
   */
  async getMyMembershipQuota(
    userId: string,
    tenantId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{
    membershipId: string;
    userId: string;
    tenantId: string;
    status: string;
    accessUntil: string | null;
    tokenLimit: number | null;
  }>> {
    const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN ?? "";
    return this.request(
      {
        method: "GET",
        path: `/v1/rbac/users/quota/${userId}`,
        headers: {
          "X-Internal-Service-Token": internalServiceToken,
          "X-Tenant-Id": tenantId,
        },
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
