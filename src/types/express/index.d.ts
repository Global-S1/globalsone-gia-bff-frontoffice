import { IRequestContext } from "../../bff/domain/interfaces/request-context.interface";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        roles?: string[];
        [key: string]: unknown;
      };
      context?: IRequestContext;
    }
  }
}

export {};
