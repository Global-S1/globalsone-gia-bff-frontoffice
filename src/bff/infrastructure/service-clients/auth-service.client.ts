import { BaseServiceClient } from "./base-service-client";
import { getServiceConfig, ServiceKeys } from "../config/backend-services.config";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  documentType: "DNI" | "CE";
  documentNumber: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  organizationToken: string;
}

export interface IAuthTokenResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    documentType: string;
    documentNumber: string;
    phoneNumber: string;
  };
}

export interface IRegisterResponse {
  message: string;
  status: "pending" | "approved";
}

export class AuthServiceClient extends BaseServiceClient {
  constructor() {
    super(getServiceConfig(ServiceKeys.MS_AUTH));
  }

  async login(
    payload: ILoginPayload,
    context: IRequestContext
  ): Promise<IServiceResponse<IAuthTokenResponse>> {
    return this.request<IAuthTokenResponse>(
      { method: "POST", path: "/v1/auth/login", body: payload },
      context
    );
  }

  async register(
    payload: IRegisterPayload,
    context: IRequestContext
  ): Promise<IServiceResponse<IRegisterResponse>> {
    return this.request<IRegisterResponse>(
      { method: "POST", path: "/v1/auth/register", body: payload },
      context
    );
  }

  async verifyOtp(
    email: string,
    code: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{ verified: boolean }>> {
    return this.request<{ verified: boolean }>(
      { method: "POST", path: "/v1/auth/verify-otp", body: { email, code } },
      context
    );
  }

  async recoverPassword(
    email: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      { method: "POST", path: "/v1/auth/recover-password", body: { email } },
      context
    );
  }

  async resetPassword(
    token: string,
    password: string,
    context: IRequestContext
  ): Promise<IServiceResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      {
        method: "POST",
        path: "/v1/auth/reset-password",
        body: { token, password },
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
