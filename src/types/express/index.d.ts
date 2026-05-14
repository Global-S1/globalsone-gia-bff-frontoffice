import { IRequestContext } from "../../bff/domain/interfaces/request-context.interface";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;              // X-User-Id
        tenantId?: string;        // X-Tenant-Id
        role?: string;            // X-User-Role
        permissions?: string;     // X-User-Permissions (comma-separated)
        uniqueTenantToken?: string; // X-Unique-Token (for ms-agents)
        email?: string;
        roles?: string[];
        [key: string]: unknown;
      };
      context?: IRequestContext;
    }
  }
}

export {};
