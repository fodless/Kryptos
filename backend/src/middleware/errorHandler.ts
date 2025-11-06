import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[${status}] ${code}: ${message}`);

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

export function createError(
  message: string,
  status: number = 500,
  code: string = 'ERROR'
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}
