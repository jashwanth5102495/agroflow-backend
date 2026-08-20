import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, message: string = 'Operation successful', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const sendError = (res: Response, message: string = 'Something went wrong', errorCode: string = 'SERVER_ERROR', statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};

export const sendPaginatedSuccess = <T>(
  res: Response, 
  data: T[], 
  pagination: { page: number; limit: number; total: number; totalPages: number }, 
  message: string = 'Operation successful',
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    pagination
  });
};
