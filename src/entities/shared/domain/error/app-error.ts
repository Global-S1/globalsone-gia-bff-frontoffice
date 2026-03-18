import { HttpCode } from "../../infraestructure/lib/http-status-codes";

export class AppError extends Error {
  public readonly name: string;
  public readonly code: string;
  public readonly httpCode: HttpCode;
  public readonly isOperational: boolean;

  constructor(
    name: string,
    httpCode: HttpCode,
    description: string,
    isOperational: boolean = true
  ) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.code = name;
    this.httpCode = httpCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, AppError);
  }
}
