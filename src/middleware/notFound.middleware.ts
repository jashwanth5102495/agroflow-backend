import { Request, Response } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 'NOT_FOUND', 404);
};
