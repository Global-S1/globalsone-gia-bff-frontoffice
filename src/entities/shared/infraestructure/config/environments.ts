import { LANG } from "../../domain/services/lang.service";
import { IEnvironments } from "../interfaces/environments.interface";

export const env: IEnvironments = {
  stage: String(process.env.STAGE || "DEV"),
  app: {
    name: process.env.APP_NAME || "BFF-SERVICE",
    port: Number(process.env.APP_PORT ?? 3000),
    defaultLang: (process.env.APP_DEFAULT_LANG as LANG) || LANG.ES,
  },
  services: {
    cache: {
      redis: {
        host: String(process.env.REDIS_HOST || "redis://localhost:6379"),
      },
    },
  },
  bff: {
    jwtSecret: String(process.env.BFF_JWT_SECRET || "change-me"),
    cacheEnabled: process.env.BFF_CACHE_ENABLED === "true",
    cacheDefaultTtl: Number(process.env.BFF_CACHE_DEFAULT_TTL || 300),
  },
  backendServices: {
    auth: {
      url: String(process.env.MS_AUTH_URL || "http://ms-auth-gia:3020"),
    },
    agents: {
      url: String(process.env.MS_AGENTS_URL || "http://ms-agents-gia:3040"),
    },
  },
};
