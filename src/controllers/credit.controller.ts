import { Request, Response, NextFunction } from 'express';
import * as creditService from '../services/credit.service';
import * as paymentService from '../services/payment.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const getFarmerCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creditData = await creditService.getFarmerCreditService(req.user!.shopId, req.params.farmerId as string);
    return sendSuccess(res, creditData, 'Credit data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getOutstandingCredits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { accounts, total } = await creditService.getOutstandingCreditsService(req.user!.shopId, skip, limit);
    return sendPaginatedSuccess(res, accounts, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const addCreditPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    
    // Using payment service to handle logic
    const payment = await paymentService.createPaymentService(req.user!.shopId, req.user!.userId, {
      referenceType: 'CREDIT_SETTLEMENT',
      amount,
      paymentMethod,
      notes,
      farmerId: req.params.farmerId as string,
    });
    
    return sendSuccess(res, payment, 'Credit payment recorded successfully');
  } catch (error) {
    next(error);
  }
};
