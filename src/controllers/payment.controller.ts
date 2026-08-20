import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.createPaymentService(req.user!.shopId, req.user!.userId, req.body);
    return sendSuccess(res, payment, 'Payment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { payments, total } = await paymentService.getPaymentsService(req.user!.shopId, skip, limit);
    return sendPaginatedSuccess(res, payments, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};
