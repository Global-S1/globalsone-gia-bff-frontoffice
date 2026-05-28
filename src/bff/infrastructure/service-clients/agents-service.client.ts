import { BaseServiceClient } from "./base-service-client";
import { getServiceConfig, ServiceKeys } from "../config/backend-services.config";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";

export interface IAgent {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelName: string;
  isDefaultForFrontoffice: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  id: string;
  userId: string;
  threadId: string;
  agentId: string;
  title: string;
  currentDayQuestionCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ICreateChatPayload {
  question: string;
  agentId?: string;
  chatPerUserId?: string;
  uniqueOrganizationToken: string;
}

export interface ICreateChatResponse {
  chatPerUserId: string;
  threadId: string;
  answer: string;
  tokensUsed?: number;
}

export class AgentsServiceClient extends BaseServiceClient {
  constructor() {
    super(getServiceConfig(ServiceKeys.MS_AGENTS));
  }

  async getDefaultAgent(
    orgToken: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IAgent>> {
    return this.request<IAgent>(
      {
        method: "GET",
        path: "/v1/agent/find-agents",
        query: { uniqueOrganizationToken: orgToken, defaultOnly: true },
      },
      context
    );
  }

  async getAgents(
    orgToken: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IAgent[]>> {
    return this.request<IAgent[]>(
      {
        method: "GET",
        path: "/v1/agent/find-agents",
        query: { uniqueOrganizationToken: orgToken },
      },
      context
    );
  }

  async createChat(
    payload: ICreateChatPayload,
    context: IRequestContext
  ): Promise<IServiceResponse<ICreateChatResponse>> {
    return this.request<ICreateChatResponse>(
      { method: "POST", path: "/v1/chat/create-chat", body: payload },
      context
    );
  }

  async getConversations(
    orgToken: string,
    userId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IConversation[]>> {
    return this.request<IConversation[]>(
      {
        method: "GET",
        path: "/v1/chat/find-chats",
        query: { uniqueOrganizationToken: orgToken, userId },
      },
      context
    );
  }

  async getConversation(
    chatId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IConversation & { interactions: IMessage[] }>> {
    return this.request<IConversation & { interactions: IMessage[] }>(
      { method: "GET", path: `/v1/chat/find-chat-by-id/${chatId}` },
      context
    );
  }

  async deleteConversation(
    chatId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<void>> {
    return this.request<void>(
      { method: "DELETE", path: `/v1/chat/delete-chat/${chatId}` },
      context
    );
  }

  async getMyUsage(
    context: IRequestContext
  ): Promise<IServiceResponse<{ tokensUsed: number; interactions: number; accessUntil: string | null }>> {
    return this.request(
      { method: "GET", path: "/v1/stats/my-usage" },
      context
    );
  }
}

let instance: AgentsServiceClient | null = null;

export function getAgentsServiceClient(): AgentsServiceClient {
  if (!instance) {
    instance = new AgentsServiceClient();
  }
  return instance;
}
