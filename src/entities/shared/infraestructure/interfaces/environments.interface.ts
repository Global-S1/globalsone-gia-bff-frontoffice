import { IEnvApp } from "./env-application.interface";

interface IEnvCacheService {
  redis?: {
    host: string;
  };
}

interface IEnvServices {
  cache: IEnvCacheService;
}

interface IEnvBff {
  cacheEnabled: boolean;
  cacheDefaultTtl: number;
}

interface IEnvBackendService {
  url: string;
}

interface IEnvBackendServices {
  auth: IEnvBackendService;
  agents: IEnvBackendService;
}

export interface IEnvironments {
  stage: string;
  tenantId: string;
  internalServiceToken: string;
  app: IEnvApp;
  services: IEnvServices;
  bff: IEnvBff;
  backendServices: IEnvBackendServices;
}
