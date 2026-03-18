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
  jwtSecret: string;
  cacheEnabled: boolean;
  cacheDefaultTtl: number;
}

interface IEnvBackendService {
  url: string;
}

interface IEnvBackendServices {
  users: IEnvBackendService;
  orders: IEnvBackendService;
  products: IEnvBackendService;
  notifications: IEnvBackendService;
}

export interface IEnvironments {
  stage: string;
  app: IEnvApp;
  services: IEnvServices;
  bff: IEnvBff;
  backendServices: IEnvBackendServices;
}
