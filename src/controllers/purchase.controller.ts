import { Request, Response, NextFunction } from 'express';
import * as purchaseService from '../services/purchase.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const createPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await purchaseService.createPurchaseService(req.user!.shopId, req.user!.userId, req.body);
    return sendSuccess(res, purchase, 'Purchase created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { purchases, total } = await purchaseService.getPurchasesService(req.user!.shopId, skip, limit);
    return sendPaginatedSuccess(res, purchases, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchaseData = await purchaseService.getPurchaseByIdService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, purchaseData, 'Purchase retrieved successfully');
  } catch (error) {
    next(error);
  }
};
