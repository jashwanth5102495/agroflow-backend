import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';
import { env } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Zod Validation Error
  if (err instanceof ZodError) {
    const errorMessages = (err as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return sendError(res, `Validation Error: ${errorMessages}`, 'VALIDATION_ERROR', 400);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `${field} already exists`, 'DUPLICATE_ERROR', 409);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 'UNAUTHORIZED', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 'UNAUTHORIZED', 401);
  }

  // General Error
  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal Server Error' 
    : err.message || 'Something went wrong';

  return sendError(res, message, err.errorCode || 'SERVER_ERROR', statusCode);
};
